import React from "react";
import VendorModuleForm from "./VendorModuleForm";
import "./AddHotel.css";

const fields = [
  { name: "hotelName", label: "Hotel name" },
  { name: "city", label: "City" },
  { name: "address", label: "Address", full: true },
  { name: "roomType", label: "Room type" },
  { name: "pricePerNight", label: "Price per night", type: "number", min: "0" },
  { name: "amenities", label: "Amenities", placeholder: "WiFi, Breakfast, Pool" },
  { name: "imageUrl", label: "Image URL", full: true },
  { name: "availableRooms", label: "Available rooms", type: "number", min: "0" },
  { name: "checkInTime", label: "Check-in time", type: "time" },
  { name: "checkOutTime", label: "Check-out time", type: "time" },
];

function AddHotel() {
  return (
    <VendorModuleForm
      module="hotel"
      title="Hotel"
      description="Add hotel rooms, pricing, amenities, and availability."
      fields={fields}
    />
  );
}

export default AddHotel;
