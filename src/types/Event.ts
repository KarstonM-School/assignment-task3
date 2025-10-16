export interface Event {
  id: string;
  name: string;
  description: string;
  organizerId: string;
  dateTime: string;
  imageUrl?: string;
  position: { latitude: number; longitude: number };
  volunteersNeeded: number;
  volunteersIds: string[];
}
