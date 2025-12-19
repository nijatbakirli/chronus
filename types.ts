export interface City {
  id: string;
  name: string;
  region: string;
  timezone: string;
  countryCode: string; // ISO 2-letter for flags
  currencyCode: string;
  baseTemp: number; // Average yearly temp in Celsius for simulation
}

export interface SuggestionRequest {
  cities: City[];
  meetingTime: string; // ISO string
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ViewMode {
  LIST = 'LIST',
  TIMELINE = 'TIMELINE'
}