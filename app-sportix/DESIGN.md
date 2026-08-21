# SPORTiX Mobile Design System Specification (DESIGN.md)
*Unified Cyber-Athletic & Neo-Glassmorphic Design Standards for SPORTiX Mobile (`app-sportix`)*

---

## 1. Brand Identity & Visual Language

SPORTiX represents an **ultra-futuristic, high-energy cyber-athletic platform**. The mobile application translates the web design language into a physical, responsive mobile experience.

### Core Visual Pillars:
1. **Deep Void Backgrounds**: Obsidian deep blacks (`#04070A`, `#060606`, `#070D12`) that make neon accents emit visual luminance.
2. **Electric Neon Accents**:
   - **⚡ Volt Green** (`#CCFF00` / `#B8FF2C`): Primary energy, action buttons, active tabs, pulse ratings.
   - **💎 Cyber Cyan** (`#00D4FF`): Skill badges, tactical positions, secondary highlights.
   - **🔮 Plasma Violet** (`#BF5FFF`): AutoSquad AI engine, matchmaking indicators, intelligence tags.
   - **🔥 Hot Coral** (`#FF3B00` / `#FF4D4D`): Urgent alerts, capacity full gauges, live match indicators.
   - **🏆 Trophy Gold** (`#FFD54A` / `#FFB800`): Prize pools, championship crowns, rewards.
3. **Glassmorphism & Surface Depth**:
   - Surfaces: `#0C131A` / `#101720` with subtle `1px` translucent borders (`rgba(255, 255, 255, 0.08)`).
   - Glow auras and multi-stop dark linear gradients to separate visual layers without heavy borders.
4. **Cinematic Hero Visuals**:
   - High-contrast stadium banners with dark gradient overlays (`rgba(7, 13, 18, 0.45)` to `#070D12`).
   - `resizeMode="cover"` and centered crop on all sports photography.

---

## 2. Typography Standard (100% Urbanist)

All typography across the mobile app strictly enforces the **Urbanist** font family loaded via `@expo-google-fonts/urbanist`:

| Token / Weight | Font Family Name | Usage |
| :--- | :--- | :--- |
| **Hero & Super Titles** | `Urbanist_900Black` | Large tournament titles (24-28px), brand headers, score displays, key metric numbers |
| **Section Headings & CTAs** | `Urbanist_800ExtraBold` | Button labels, card titles, section headers, badge text, stat labels |
| **Card Titles & Emphases** | `Urbanist_700Bold` | Usernames, filter tab text, match rounds, athlete roles |
| **Subtitles & Badges** | `Urbanist_600SemiBold` | Venue locations, secondary descriptions, timestamps |
| **Body Text** | `Urbanist_500Medium` | Announcement text, activity descriptions, chat messages |
| **Captions & Small Text** | `Urbanist_400Regular` | Long-form event briefings, fine-print rules |

---

## 3. Component Architecture & UI Patterns

### 3.1 Top App Bar
- **Branding**: `⚡ SPORTIX` with Volt Zap circle (`#CCFF00`) and uppercase bold text.
- **Actions Row**:
  - Notification Bell with glowing red badge counter (`3`).
  - Settings Gear (`#94A3B8`).
  - Circular Athlete Profile Avatar with a 1.5px Volt border.

### 3.2 5-Tab Navigation Bar
```
[ 🏠 Hypezone ]  [ 🏆 Clashub ]  [ (⚡) SPORTIX PULSE ]  [ 💬 Huddle ]  [ 🧬 Profile DNA ]
```
- **Center Pulse Button**: Elevated, animated neon pulse wave button with continuous electric ring aura.
- **Active Tab Pill**: Solid Volt background (`#CCFF00`) with pitch black text (`#000000`) and `Urbanist_900Black`.
- **Inactive Tab**: Muted slate (`#64748B`) with `Urbanist_700Bold`.

### 3.3 4-Card Key Metrics Grid
Standardized for tournament and match screens:
1. `👥 PLAYERS`: Active participants / max capacity in Neon Green (`#00FF78`).
2. `🏆 PRIZE POOL`: Tournament prize pool / cash rewards in Trophy Gold (`#FFB800`).
3. `⭐ SKILL`: Competitive tier (e.g., Semi-Pro, Pro, Casual) in Cyber Cyan (`#00D4FF`).
4. `📊 CAPACITY`: Real-time fill percentage in Coral/Red (`#FF4D4D`).

### 3.4 Action CTAs & Cards
- **Primary Host Action**: Vivid Neon Orange / Volt (`#FF6B00` / `#CCFF00`) button with high-contrast bold black text.
- **Participation Status**:
  - `✓ YOU PARTICIPATED ✓`: Dark card with green border, green checkmark icon, and withdrawal modal.
  - `JOIN TOURNAMENT`: Role selection chips (Striker, Midfielder, Defender, Goalkeeper) + confirmation button.
- **AutoSquad Lab Card**:
  - Dark container with Purple Zap icon (`#BF5FFF`), `AUTOSQUAD LAB` title, and navigation to the AI squad formation engine.

### 3.5 Real-Time Activity & Announcements
- **Announcements**: Highlighted card with `GENERAL` badge, publication timestamp, bold title, and organizer attribution.
- **Live Activity Feed**: Live red indicator `● REAL-TIME` with athlete avatars, colored status dots, and relative elapsed time (`2m`, `5m`, `12m`).

---

## 4. Motion & Haptic Feedback Guidelines

- **Micro-Animations**:
  - Screen transitions powered by `react-native-reanimated` (`FadeInDown`, `FadeInUp`, `Layout.springify()`).
  - Pulse ring animation on center tab logo and circular gauges.
- **Haptic Feedback**:
  - **Light** (`triggerHaptic('light')`): Tab switches, filter pills, search focus, card touches.
  - **Medium** (`triggerHaptic('medium')`): Navigation back, modal open/close, discussion comments.
  - **Heavy** (`triggerHaptic('heavy')`): Tournament registration, withdrawal, AI AutoSquad trigger, team creation.

---

## 5. Mobile Theme Tokens Reference

```typescript
export const darkColors = {
  background: '#04070A',
  surface: '#0C131A',
  card: '#121A22',
  elevated: '#18202A',
  border: 'rgba(255, 255, 255, 0.08)',
  volt: '#CCFF00',
  cyan: '#00D4FF',
  plasma: '#BF5FFF',
  hot: '#FF3B00',
  gold: '#FFD54A',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};
```
