import React from "react";
import VendorModuleForm from "./VendorModuleForm";
import "./AddTravelPackage.css";

const fields = [
  { name: "packageTitle", label: "Package title" },
  { name: "destination", label: "Destination" },
  { name: "daysNights", label: "Days / Nights", placeholder: "4 Days / 3 Nights" },
  { name: "pickupLocation", label: "Pickup location" },
  { name: "pricePerPerson", label: "Price per person", type: "number", min: "0" },
  { name: "includedServices", label: "Included services", placeholder: "Hotel, Meals, Sightseeing", full: true },
  { name: "availableDates", label: "Available dates", placeholder: "2026-07-02, 2026-07-12" },
  { name: "totalSeats", label: "Total seats", type: "number", min: "0" },
  { name: "imageUrl", label: "Image URL", full: true },
];

function AddTravelPackage() {
  return (
    <VendorModuleForm
      module="travel-package"
      title="Travel Package"
      description="Add holiday package inventory, itinerary basics, dates, and pricing."
      fields={fields}
    />
  );
}

export default AddTravelPackage;
