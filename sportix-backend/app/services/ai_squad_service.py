import uuid
import asyncio
import math
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User
from app.models.pulse import PulseScore
from app.websockets.manager import ws_manager

POSITION_QUOTAS = {
    "football": {"GK": 1, "DEF": 4, "MID": 3, "ATT": 3},
    "basketball": {"Guard": 2, "Forward": 2, "Center": 1},
    "cricket": {"Batsman": 5, "Bowler": 4, "All_Rounder": 1, "Wicketkeeper": 1}
}

def calculate_distance(lat1, lon1, lat2, lon2):
    if not lat1 or not lon1 or not lat2 or not lon2:
        return 50.0  # Default average distance in km
    # Simple Haversine approximation
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_skill_similarity(level1: str, level2: str) -> float:
    tiers = ["beginner", "amateur", "semi_pro", "pro", "elite"]
    try:
        idx1 = tiers.index(level1.lower())
        idx2 = tiers.index(level2.lower())
        diff = abs(idx1 - idx2)
        return max(0.0, 1.0 - (diff * 0.25))
    except ValueError:
        return 0.5

async def calculate_compatibility(
    user1: User,
    user2: User,
    pulse1: PulseScore,
    pulse2: PulseScore
) -> float:
    # 1. Pulse score similarity (30%)
    pulse_diff = abs(pulse1.total_pulse - pulse2.total_pulse) if pulse1 and pulse2 else 50.0
    pulse_comp = max(0.0, 1.0 - (pulse_diff / 200.0))
    
    # 2. Location proximity (35%)
    dist = calculate_distance(user1.latitude, user1.longitude, user2.latitude, user2.longitude)
    loc_comp = max(0.0, 1.0 - (dist / 100.0))  # Max score inside 100km radius
    if user1.city and user2.city and user1.city.lower() == user2.city.lower():
        loc_comp = max(loc_comp, 0.95)
        
    # 3. Skill Level Similarity (20%)
    skill_comp = get_skill_similarity(user1.experience_level, user2.experience_level)
    
    # 4. Shared Sports (15%)
    sports1 = set(user1.sports or [user1.sport] if user1.sport else [])
    sports2 = set(user2.sports or [user2.sport] if user2.sport else [])
    shared = sports1.intersection(sports2)
    sport_comp = 1.0 if shared else 0.0
    
    # Weighted sum
    comp_score = (pulse_comp * 0.30) + (loc_comp * 0.35) + (skill_comp * 0.20) + (sport_comp * 0.15)
    return round(comp_score * 100, 2)

async def match_ai_squad(
    db: AsyncSession,
    requesting_user_id: uuid.UUID,
    sport: str
) -> dict:
    sport_clean = sport.strip().lower()
    
    # WebSocket typewriter log helper
    async def log_step(message: str):
        print(f"[AI Matchmaker] {message}")
        await ws_manager.send_notification_to_user(
            requesting_user_id,
            {
                "event": "ai_matchmaker_log",
                "data": {
                    "message": message,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
        await asyncio.sleep(1.5)

    # Step 1: Initializing
    await log_step(f"Initializing AI Matchmaker for {sport.title()}...")
    
    # Fetch all candidate athletes who match the sport
    result = await db.execute(
        select(User).where(
            User.id != requesting_user_id,
            User.role == "athlete"
        )
    )
    all_users = result.scalars().all()
    
    # Filter users that have this sport in their profile
    candidates = []
    for u in all_users:
        user_sports = [s.lower() for s in (u.sports or [])]
        if u.sport:
            user_sports.append(u.sport.lower())
        if sport_clean in user_sports:
            candidates.append(u)
            
    await log_step(f"Found {len(candidates)} potential candidates playing {sport.title()}.")
    
    # Step 2: Fetch requester details
    requester = await db.get(User, requesting_user_id)
    r_pulse_res = await db.execute(select(PulseScore).where(PulseScore.user_id == requesting_user_id))
    r_pulse = r_pulse_res.scalar_one_or_none()
    
    await log_step("Analyzing geographic clusters and skill tier mappings...")
    
    # Calculate compatibilities
    user_compatibilities = []
    for candidate in candidates:
        c_pulse_res = await db.execute(select(PulseScore).where(PulseScore.user_id == candidate.id))
        c_pulse = c_pulse_res.scalar_one_or_none()
        comp = await calculate_compatibility(requester, candidate, r_pulse, c_pulse)
        user_compatibilities.append((candidate, comp))
        
    # Sort candidates by compatibility score descending
    user_compatibilities.sort(key=lambda x: x[1], reverse=True)
    
    await log_step("Running position quota balancing algorithm...")
    
    # Greedy Position Matching
    quotas = POSITION_QUOTAS.get(sport_clean, {"Any": 10})
    current_slots = {pos: 0 for pos in quotas.keys()}
    max_slots = sum(quotas.values()) - 1  # Requester takes one slot
    
    selected_players = []
    total_comp_sum = 0
    
    # Let's assign requester's position if applicable
    r_pos = requester.position or "Any"
    if r_pos in current_slots:
        current_slots[r_pos] = 1
        
    for player, comp in user_compatibilities:
        if len(selected_players) >= max_slots:
            break
            
        pos = player.position or "Any"
        # Determine target position pool
        assigned_pos = "Any"
        if pos in quotas:
            if current_slots[pos] < quotas[pos]:
                assigned_pos = pos
            else:
                continue  # Position quota full, skip
        else:
            # Check if there is an "Any" fallback quota
            if "Any" in current_slots and current_slots["Any"] < quotas["Any"]:
                assigned_pos = "Any"
            else:
                continue
                
        current_slots[assigned_pos] += 1
        selected_players.append({
            "id": str(player.id),
            "username": player.username,
            "full_name": player.full_name,
            "position": player.position,
            "experience_level": player.experience_level,
            "avatar_url": player.avatar_url,
            "city": player.city,
            "compatibility": comp
        })
        total_comp_sum += comp
        
    await log_step("Assembling optimal squad configuration and calculating chemistry metrics...")
    
    avg_compatibility = round(total_comp_sum / len(selected_players), 2) if selected_players else 0.0
    
    # Generate mock AI summary report
    squad_name = f"AI {sport.title()} Elite"
    
    response_data = {
        "squad_name": squad_name,
        "sport": sport.title(),
        "chemistry_score": avg_compatibility,
        "team_size": len(selected_players) + 1,
        "positions_filled": current_slots,
        "players": selected_players,
        "requester": {
            "id": str(requester.id),
            "username": requester.username,
            "full_name": requester.full_name,
            "position": requester.position
        }
    }
    
    # Final WebSocket status
    await ws_manager.send_notification_to_user(
        requesting_user_id,
        {
            "event": "ai_matchmaker_complete",
            "data": response_data
        }
    )
    
    return response_data
