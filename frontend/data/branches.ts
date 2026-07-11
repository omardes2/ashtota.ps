import type { Branch } from "@/types";

export const branches: Branch[] = [
  {
    id: "khalil",
    name: "فرع الخليل",
    city: "الخليل",
    address: "دوار ابن رشد",
    isOpen: true,
    deliveryTime: "30 - 45 دقيقة",
    minOrder: 20,
    deliveryFeeFrom: 10,
    phone: "022220001",
    whatsapp: "970599000001",
  },
  {
    id: "ramallah",
    name: "فرع رام الله",
    city: "رام الله",
    address: "شارع الإرسال",
    isOpen: true,
    deliveryTime: "35 - 50 دقيقة",
    minOrder: 25,
    deliveryFeeFrom: 12,
    phone: "022220002",
    whatsapp: "970599000002",
  },
  {
    id: "nablus",
    name: "فرع نابلس",
    city: "نابلس",
    address: "شارع تونس",
    isOpen: true,
    deliveryTime: "30 - 45 دقيقة",
    minOrder: 20,
    deliveryFeeFrom: 10,
    phone: "022220003",
    whatsapp: "970599000003",
  },
  {
    id: "bethlehem",
    name: "فرع بيت لحم",
    city: "بيت لحم",
    address: "شارع القدس",
    isOpen: false,
    deliveryTime: "35 - 50 دقيقة",
    minOrder: 20,
    deliveryFeeFrom: 12,
    phone: "022220004",
    whatsapp: "970599000004",
  },
];

export function getBranch(id: string | null): Branch | undefined {
  return branches.find((b) => b.id === id);
}
