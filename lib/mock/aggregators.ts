import { AccountValidationResult, TargetAccountPayload } from '../types';

/**
 * Simulates real-time upstream Aggregator Account Validation API
 * (e.g. UniPin, Codashop, SmileOne, Moonton API, HoYoverse, Riot API)
 */
export async function validateTargetAccount(
  productSlug: string,
  payload: TargetAccountPayload
): Promise<AccountValidationResult> {
  // Simulate network latency (200-500ms)
  await new Promise((resolve) => setTimeout(resolve, 350));

  switch (productSlug) {
    case 'mobile-legends': {
      const userId = String(payload.userId || '').trim();
      const zoneId = String(payload.zoneId || '').trim();

      if (!userId || !zoneId) {
        return { isValid: false, errorMessage: 'User ID and Zone ID are required.' };
      }

      if (userId.length < 5 || userId.length > 10 || isNaN(Number(userId))) {
        return { isValid: false, errorMessage: 'Invalid Mobile Legends User ID format.' };
      }

      if (zoneId.length < 3 || zoneId.length > 6 || isNaN(Number(zoneId))) {
        return { isValid: false, errorMessage: 'Invalid Zone ID format (expected 4-5 digits).' };
      }

      // Generate consistent realistic nicknames based on hash of userId
      const prefix = ['Dragon', 'Shadow', 'Slayer', 'Viper', 'Mythic', 'Apex', 'Phantom', 'Luna', 'Kagura', 'Chou'];
      const suffix = ['Pro', 'King', 'God', '99', 'GG', 'Ace', 'Lord', 'ID', 'Master', 'Star'];
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const nickname = `${prefix[hash % prefix.length]}_${suffix[(hash + Number(zoneId)) % suffix.length]}`;

      return {
        isValid: true,
        nickname: nickname,
        region: 'ID (Indonesia / Southeast Asia)',
        level: (hash % 60) + 30,
        rawResponse: {
          status: 'SUCCESS',
          code: 200,
          data: {
            user_id: userId,
            zone_id: zoneId,
            username: nickname,
            current_rank: 'Mythical Immortal'
          }
        }
      };
    }

    case 'genshin-impact': {
      const uid = String(payload.uid || '').trim();
      const server = String(payload.server || '').trim();

      if (!uid || !server) {
        return { isValid: false, errorMessage: 'UID and Server selection are required.' };
      }

      if (uid.length !== 9 || isNaN(Number(uid))) {
        return { isValid: false, errorMessage: 'Genshin Impact UID must be exactly 9 digits.' };
      }

      const travelers = ['Traveler_Aether', 'Traveler_Lumine', 'RaidenShogun_Simp', 'HuTaoMain', 'ArchonZhongli', 'Kazuha_Swirl'];
      const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const nickname = travelers[hash % travelers.length];

      return {
        isValid: true,
        nickname: `${nickname} (AR ${55 + (hash % 6)})`,
        region: server.replace('os_', '').toUpperCase(),
        level: 55 + (hash % 6),
        rawResponse: {
          status: 'SUCCESS',
          data: { uid, server, nickname, adventure_rank: 55 + (hash % 6), world_level: 8 }
        }
      };
    }

    case 'valorant': {
      const riotId = String(payload.riotId || '').trim();
      if (!riotId || !riotId.includes('#')) {
        return { isValid: false, errorMessage: 'Riot ID must be in format Username#Tagline (e.g. TenZ#NA1)' };
      }

      const [name, tag] = riotId.split('#');
      if (!name || !tag) {
        return { isValid: false, errorMessage: 'Both Riot username and Tagline are required.' };
      }

      return {
        isValid: true,
        nickname: `${name} #${tag}`,
        region: 'APAC / Global',
        level: 120,
        rawResponse: {
          status: 'SUCCESS',
          data: { puuid: 'riot-val-' + Math.random().toString(36).substring(2, 9), gameName: name, tagLine: tag }
        }
      };
    }

    case 'free-fire': {
      const playerId = String(payload.playerId || '').trim();
      if (!playerId || playerId.length < 7 || isNaN(Number(playerId))) {
        return { isValid: false, errorMessage: 'Player ID must be 8-10 digits.' };
      }

      const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const names = ['FF_BooyahGod', 'Sultan_FreeFire', 'Ghost_Rider_FF', 'Alok_Squad_01'];
      return {
        isValid: true,
        nickname: names[hash % names.length],
        region: 'Indonesia / Global',
        level: 65
      };
    }

    case 'pubg-mobile': {
      const playerId = String(payload.playerId || '').trim();
      if (!playerId || playerId.length < 8 || isNaN(Number(playerId))) {
        return { isValid: false, errorMessage: 'Character ID must be at least 8-10 digits.' };
      }

      const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const names = ['PUBG_Conqueror', 'ChickenDinner_King', 'SquadWipe_No1', 'SnipingLegend'];
      return {
        isValid: true,
        nickname: names[hash % names.length],
        region: 'Asia',
        level: 72
      };
    }

    case 'roblox': {
      const username = String(payload.username || '').trim();
      if (!username || username.length < 3) {
        return { isValid: false, errorMessage: 'Roblox username must be at least 3 characters.' };
      }
      return {
        isValid: true,
        nickname: `@${username}`,
        region: 'Global',
        avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=150&auto=format&fit=crop'
      };
    }

    case 'steam-wallet': {
      const email = String(payload.email || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return { isValid: false, errorMessage: 'Please provide a valid email address for code delivery.' };
      }
      return {
        isValid: true,
        nickname: `Delivery to: ${email}`,
        region: 'Global Code'
      };
    }

    default: {
      return {
        isValid: true,
        nickname: 'Player_' + Math.floor(1000 + Math.random() * 9000),
        region: 'Global'
      };
    }
  }
}
