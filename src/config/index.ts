import { PlatformSettings } from '../types';

export const APP_CONFIG = {
  appName: 'Feedora',
  companyName: 'Feedora Technologies',
  tagline: 'Turn Every Customer Experience Into Meaningful Feedback',
  primaryColor: '#0F917D',
  websiteUrl: 'https://feedora.app',
  defaultGoogleReviewUrl: '', // To be configured by owner
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  productName: 'Feedora',
  primaryColor: '#0F917D',
  aiProvider: 'openrouter',
  aiModel: 'inclusionai/ling-3.0-flash-sante:free',
  aiTemperature: 0.7,
  maxOutputLength: 350,
  enableAuditLogging: true,
};

// Rating questions tailored to user sentiment
export const RATING_PROMPTS: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'Sorry to hear that.',
    subtitle: 'What could we improve for your next visit?',
  },
  2: {
    title: 'Thanks for your feedback.',
    subtitle: 'What could we improve?',
  },
  3: {
    title: 'Thanks for visiting!',
    subtitle: 'What did you like and what could be better?',
  },
  4: {
    title: 'Glad you had a good experience!',
    subtitle: 'What did you enjoy most about your visit?',
  },
  5: {
    title: 'Wonderful!',
    subtitle: 'What did you enjoy most?',
  },
};

// Quick selection chips tailored to sentiment
export const RATING_TAG_OPTIONS: Record<number, string[]> = {
  5: [
    'Friendly staff',
    'Great service',
    'Excellent quality',
    'Great ambience',
    'Fast service',
    'Good value',
    'Clean environment',
    'Welcoming atmosphere',
    'Great music',
    'Delicious food & drinks',
  ],
  4: [
    'Friendly staff',
    'Good service',
    'Nice ambience',
    'Good quality',
    'Clean space',
    'Fair pricing',
    'Quick turnaround',
    'Easy parking',
  ],
  3: [
    'Service speed',
    'Staff attentiveness',
    'Atmosphere',
    'Pricing & value',
    'Cleanliness',
    'Food / drink quality',
    'Wait time',
  ],
  2: [
    'Wait time',
    'Customer service',
    'Food / drink quality',
    'Pricing & billing',
    'Cleanliness',
    'Staff communication',
    'Noise level',
  ],
  1: [
    'Customer service',
    'Excessive wait time',
    'Quality of order',
    'Staff attitude',
    'Billing issues',
    'Cleanliness',
    'Communication',
  ],
};
