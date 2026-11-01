export type ReservationStatus =
  | 'Pending'
  | 'Confirmed'
  | 'CheckedIn'
  | 'Rejected'
  | 'Cancelled'
  | 'Expired'
  | 'NoShow';

export type Reservation = {
  reservationId: string;
  restaurantId: string;
  requestedAreaId: string;
  contactName: string;
  phone: string;
  partySize: number;
  startAt: string;
  endAt: string;
  holdUntil: string | null;
  status: ReservationStatus;
  approvedByRef: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelledByRef: string | null;
  assignedRestaurantId: string | null;
  assignedAreaId: string | null;
  hasConsistentAssignment: boolean;
  tableSessionId: string | null;
  assignedTableIds: string[];
};

export type AvailabilityQuery = {
  restaurantId: string;
  areaId: string;
  partySize: number;
  startAt: string;
};

export type AvailableTable = {
  tableId: string;
  tableCode: string;
  capacity: number;
  cleaningStatus: string;
  isScheduleAvailable: boolean;
  reasons: string[];
};

export type ReservationAvailability = {
  restaurantId: string;
  areaId: string;
  partySize: number;
  evaluatedAt: string;
  startAt: string;
  endAt: string;
  holdStartsAt: string;
  holdUntil: string;
  blockedUntil: string;
  availableCapacity: number;
  hasEnoughCapacity: boolean;
  requiresStaffLayoutReview: boolean;
  reasons: string[];
  tables: AvailableTable[];
};

export type ReservationAction =
  | { action: 'confirm'; id: string; tableIds: string[] }
  | { action: 'update'; id: string; tableIds: string[]; startAt: string }
  | { action: 'reject' | 'check-in' | 'cancel'; id: string };
