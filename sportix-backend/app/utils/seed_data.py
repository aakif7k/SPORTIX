import asyncio
import uuid
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, Follower
from app.models.badge import Badge
from app.models.mission import DailyMission
from app.models.squad import Squad, SquadMember
from app.models.event import Event, EventParticipant
from app.models.pulse import PulseScore
from app.models.level import UserLevel
from app.models.coins import UserCoins
from app.models.streak import UserStreak

# Badge templates
BADGES = [
    {"name": "Novice Competitor", "description": "Reach Level 5 in progression.", "badge_type": "level_rank", "tier": "bronze", "level_required": 5, "condition_type": "level_up", "condition_value": 5, "icon_key": "badge_level_5", "glow_color": "#CD7F32"},
    {"name": "Veteran Athlete", "description": "Reach Level 15 in progression.", "badge_type": "level_rank", "tier": "silver", "level_required": 15, "condition_type": "level_up", "condition_value": 15, "icon_key": "badge_level_15", "glow_color": "#C0C0C0"},
    {"name": "Elite Champion", "description": "Reach Level 30 in progression.", "badge_type": "level_rank", "tier": "gold", "level_required": 30, "condition_type": "level_up", "condition_value": 30, "icon_key": "badge_level_30", "glow_color": "#FFD700"},
    
    {"name": "Consistent Participant", "description": "Maintain a 3-day active streak.", "badge_type": "streak", "tier": "bronze", "level_required": 1, "condition_type": "streak", "condition_value": 3, "icon_key": "badge_streak_3", "glow_color": "#CD7F32"},
    {"name": "Weekly Dedicated", "description": "Maintain a 7-day active streak.", "badge_type": "streak", "tier": "silver", "level_required": 1, "condition_type": "streak", "condition_value": 7, "icon_key": "badge_streak_7", "glow_color": "#C0C0C0"},
    {"name": "Streak Overlord", "description": "Maintain a 30-day active streak.", "badge_type": "streak", "tier": "elite", "level_required": 1, "condition_type": "streak", "condition_value": 30, "icon_key": "badge_streak_30", "glow_color": "#CCFF00", "is_animated": True},
    
    {"name": "Grandmaster Ascendant", "description": "Unlock Grandmaster prestige tier.", "badge_type": "prestige", "tier": "prestige", "level_required": 100, "condition_type": "prestige", "condition_value": 1, "icon_key": "badge_prestige_1", "glow_color": "#9400D3", "is_animated": True},
]

# Daily Missions templates
MISSIONS = [
    {"title": "Daily Entry", "description": "Log in to SPORTiX", "mission_type": "login", "target_count": 1, "pulse_reward": 5.0, "coins_reward": 10, "xp_reward": 10, "difficulty": "easy"},
    {"title": "Social Connection", "description": "Follow another athlete", "mission_type": "follow_athlete", "target_count": 1, "pulse_reward": 5.0, "coins_reward": 15, "xp_reward": 10, "difficulty": "easy"},
    {"title": "Liker", "description": "Like 3 posts in the feed", "mission_type": "react_posts", "target_count": 3, "pulse_reward": 5.0, "coins_reward": 15, "xp_reward": 10, "difficulty": "easy"},
    {"title": "Content Creator", "description": "Share a status update or thought", "mission_type": "create_post", "target_count": 1, "pulse_reward": 10.0, "coins_reward": 25, "xp_reward": 25, "difficulty": "medium"},
    {"title": "Conversationalist", "description": "Comment on 2 feed posts", "mission_type": "comment", "target_count": 2, "pulse_reward": 10.0, "coins_reward": 25, "xp_reward": 25, "difficulty": "medium"},
    {"title": "Chatter", "description": "Send 3 messages to squad members", "mission_type": "message_teammate", "target_count": 3, "pulse_reward": 10.0, "coins_reward": 30, "xp_reward": 25, "difficulty": "medium"},
    {"title": "Event Participant", "description": "Join a local sports event", "mission_type": "join_event", "target_count": 1, "pulse_reward": 12.0, "coins_reward": 30, "xp_reward": 30, "difficulty": "medium"},
    {"title": "Victor", "description": "Win a competitive match", "mission_type": "win_match", "target_count": 1, "pulse_reward": 20.0, "coins_reward": 50, "xp_reward": 50, "difficulty": "hard"},
    {"title": "Showcase", "description": "Post a media highlight on your profile", "mission_type": "upload_highlight", "target_count": 1, "pulse_reward": 20.0, "coins_reward": 50, "xp_reward": 50, "difficulty": "hard"},
    {"title": "Competitor", "description": "Complete 2 full matches", "mission_type": "complete_match", "target_count": 2, "pulse_reward": 20.0, "coins_reward": 45, "xp_reward": 50, "difficulty": "hard"},
]

# 10 Athletes list
ATHLETES = [
    {"username": "ronaldo7", "full_name": "Cristiano Ronaldo", "email": "cr7@sportix.com", "sport": "Football", "position": "ATT", "lat": 51.5074, "lon": -0.1278, "city": "London", "level": 12},
    {"username": "leomessi", "full_name": "Lionel Messi", "email": "messi10@sportix.com", "sport": "Football", "position": "ATT", "lat": 51.5200, "lon": -0.1100, "city": "London", "level": 35},
    {"username": "virat18", "full_name": "Virat Kohli", "email": "virat@sportix.com", "sport": "Cricket", "position": "Batsman", "lat": 51.4900, "lon": -0.1500, "city": "London", "level": 28},
    {"username": "kingjames", "full_name": "LeBron James", "email": "lebron@sportix.com", "sport": "Basketball", "position": "Forward", "lat": 40.7128, "lon": -74.0060, "city": "New York", "level": 50},
    {"username": "stephencurry", "full_name": "Steph Curry", "email": "curry@sportix.com", "sport": "Basketball", "position": "Guard", "lat": 40.7300, "lon": -74.0100, "city": "New York", "level": 42},
    {"username": "serenaw", "full_name": "Serena Williams", "email": "serena@sportix.com", "sport": "Tennis", "position": "Any", "lat": 40.7500, "lon": -73.9900, "city": "New York", "level": 30},
    {"username": "neymarjr", "full_name": "Neymar Jr", "email": "neymar@sportix.com", "sport": "Football", "position": "MID", "lat": 51.5100, "lon": -0.1400, "city": "London", "level": 9},
    {"username": "mbappe", "full_name": "Kylian Mbappe", "email": "mbappe@sportix.com", "sport": "Football", "position": "ATT", "lat": 51.5300, "lon": -0.1200, "city": "London", "level": 18},
    {"username": "deere", "full_name": "Kevin De Bruyne", "email": "kdb@sportix.com", "sport": "Football", "position": "MID", "lat": 51.4800, "lon": -0.1000, "city": "London", "level": 22},
    {"username": "vandyk", "full_name": "Virgil van Dijk", "email": "virgil@sportix.com", "sport": "Football", "position": "DEF", "lat": 51.4700, "lon": -0.1300, "city": "London", "level": 15},
]

async def seed_data():
    print("[Seed Data] Starting database seed...")
    
    async with AsyncSessionLocal() as db:
        # 1. Seed Badges
        print("[Seed Data] Seeding cosmetic badges...")
        for b in BADGES:
            check_badge = await db.execute(select(Badge).where(Badge.name == b["name"]))
            if not check_badge.scalar_one_or_none():
                badge = Badge(
                    id=uuid.uuid4(),
                    name=b["name"],
                    description=b["description"],
                    badge_type=b["badge_type"],
                    tier=b["tier"],
                    level_required=b["level_required"],
                    condition_type=b["condition_type"],
                    condition_value=b["condition_value"],
                    icon_key=b["icon_key"],
                    glow_color=b["glow_color"],
                    is_animated=b.get("is_animated", False)
                )
                db.add(badge)
                
        # 2. Seed Daily Missions
        print("[Seed Data] Seeding daily mission templates...")
        for m in MISSIONS:
            check_miss = await db.execute(select(DailyMission).where(DailyMission.title == m["title"]))
            if not check_miss.scalar_one_or_none():
                miss = DailyMission(
                    id=uuid.uuid4(),
                    title=m["title"],
                    description=m["description"],
                    mission_type=m["mission_type"],
                    target_count=m["target_count"],
                    pulse_reward=m["pulse_reward"],
                    coins_reward=m["coins_reward"],
                    xp_reward=m["xp_reward"],
                    difficulty=m["difficulty"],
                    is_active=True
                )
                db.add(miss)
                
        await db.commit()

        # 3. Seed Users & Gamification
        print("[Seed Data] Seeding athlete profiles...")
        seeded_users = []
        password_hash = get_password_hash("password123")
        
        for u in ATHLETES:
            check_user = await db.execute(select(User).where(User.username == u["username"]))
            db_user = check_user.scalar_one_or_none()
            
            if not db_user:
                db_user = User(
                    id=uuid.uuid4(),
                    email=u["email"],
                    username=u["username"],
                    hashed_password=password_hash,
                    full_name=u["full_name"],
                    role="athlete",
                    sport=u["sport"],
                    sports=[u["sport"]],
                    position=u["position"],
                    experience_level="pro" if u["level"] > 20 else "amateur",
                    location=f"{u['city']}, UK" if u["city"] == "London" else f"{u['city']}, USA",
                    city=u["city"],
                    latitude=u["lat"],
                    longitude=u["lon"],
                    bio=f"Professional {u['sport']} player looking for local squads.",
                    is_open_to_recruit=True,
                    is_active=True
                )
                db.add(db_user)
                await db.flush()
                
                # Initialize profiles
                user_level = UserLevel(
                    id=uuid.uuid4(),
                    user_id=db_user.id,
                    current_level=u["level"],
                    current_pulse=50.0,
                    pulse_for_next=float(100 + u["level"] * 50),
                    prestige_rank="none",
                    total_pulse_ever=float(u["level"] * 300),
                    level_ups_count=u["level"] - 1
                )
                user_coins = UserCoins(
                    id=uuid.uuid4(),
                    user_id=db_user.id,
                    balance=500 + u["level"] * 10,
                    total_earned=1000 + u["level"] * 10,
                    total_spent=500
                )
                user_streak = UserStreak(
                    id=uuid.uuid4(),
                    user_id=db_user.id,
                    current_streak=3,
                    longest_streak=5,
                    last_active_date=datetime.date.today()
                )
                pulse_score = PulseScore(
                    id=uuid.uuid4(),
                    user_id=db_user.id,
                    total_pulse=150.0 + u["level"] * 5,
                    match_performance=65.0,
                    consistency=70.0,
                    team_chemistry=80.0,
                    reliability=85.0,
                    activity=60.0,
                    leadership=50.0
                )
                db.add(user_level)
                db.add(user_coins)
                db.add(user_streak)
                db.add(pulse_score)
                
            seeded_users.append(db_user)
            
        await db.commit()
        
        # 4. Seed Squads
        print("[Seed Data] Seeding squads...")
        # Squad 1: West London FC (Football)
        london_cap = seeded_users[0]  # Ronaldo
        check_squad1 = await db.execute(select(Squad).where(Squad.name == "West London FC"))
        squad1 = check_squad1.scalar_one_or_none()
        
        if not squad1:
            squad1 = Squad(
                id=uuid.uuid4(),
                name="West London FC",
                sport="Football",
                captain_id=london_cap.id,
                formation="4-3-3",
                tactical_notes="Fast counter attack play style.",
                chemistry_score=85.0,
                trust_index=90.0,
                communication_score=80.0,
                coordination_score=85.0,
                win_count=8,
                draw_count=2,
                loss_count=1,
                is_ai_generated=False
            )
            db.add(squad1)
            await db.flush()
            
            # Add members to squad 1
            footballers = [u for u in seeded_users if u.sport == "Football"]
            for f in footballers:
                member = SquadMember(
                    id=uuid.uuid4(),
                    squad_id=squad1.id,
                    user_id=f.id,
                    role="captain" if f.id == london_cap.id else "member",
                    position=f.position,
                    is_active=True
                )
                db.add(member)
                
        # Squad 2: Brooklyn Hoops (Basketball)
        ny_cap = seeded_users[3]  # LeBron James
        check_squad2 = await db.execute(select(Squad).where(Squad.name == "Brooklyn Hoops"))
        squad2 = check_squad2.scalar_one_or_none()
        
        if not squad2:
            squad2 = Squad(
                id=uuid.uuid4(),
                name="Brooklyn Hoops",
                sport="Basketball",
                captain_id=ny_cap.id,
                formation="Standard",
                tactical_notes="Strong perimeter defense.",
                chemistry_score=78.0,
                trust_index=80.0,
                communication_score=75.0,
                coordination_score=79.0,
                win_count=5,
                draw_count=0,
                loss_count=3,
                is_ai_generated=False
            )
            db.add(squad2)
            await db.flush()
            
            # Add members to squad 2
            bballers = [u for u in seeded_users if u.sport == "Basketball"]
            for b in bballers:
                member = SquadMember(
                    id=uuid.uuid4(),
                    squad_id=squad2.id,
                    user_id=b.id,
                    role="captain" if b.id == ny_cap.id else "member",
                    position=b.position,
                    is_active=True
                )
                db.add(member)

        # 5. Seed Events
        print("[Seed Data] Seeding sports events...")
        check_event = await db.execute(select(Event).where(Event.title == "Stamford Bridge Friendly"))
        if not check_event.scalar_one_or_none():
            event = Event(
                id=uuid.uuid4(),
                organizer_id=london_cap.id,
                title="Stamford Bridge Friendly",
                description="Community football match at Stamford Bridge local fields.",
                sport="Football",
                event_type="community",
                format="open",
                date=datetime.datetime.utcnow() + datetime.timedelta(days=3),
                venue="Stamford Bridge Local Pitch",
                city="London",
                max_participants=22,
                current_count=3,
                status="open",
                is_ai_managed=False
            )
            db.add(event)
            await db.flush()
            
            # Add organizer and players
            for usr in seeded_users[:3]:
                part = EventParticipant(
                    id=uuid.uuid4(),
                    event_id=event.id,
                    user_id=usr.id,
                    entry_type="solo",
                    status="confirmed"
                )
                db.add(part)
                
        await db.commit()
        print("[Seed Data] Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
