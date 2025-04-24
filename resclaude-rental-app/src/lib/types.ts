export interface Reservation {
  id: string;
  startDate: Date;
  endDate: Date;
  lastName: string;
  firstName: string;
  address: string;
  locality: string;
  city: string;
  email: string;
  phone: string;
  numberOfPeople: string;
  message: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
