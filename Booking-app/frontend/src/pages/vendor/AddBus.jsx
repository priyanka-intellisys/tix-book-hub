import React from "react";
import VendorModuleForm from "./VendorModuleForm";
import "./AddBus.css";

const fields = [
  { name: "operatorName", label: "Bus operator name" },
  { name: "fromCity", label: "From city" },
  { name: "toCity", label: "To city" },
  { name: "departureTime", label: "Departure time", type: "time" },
  { name: "arrivalTime", label: "Arrival time", type: "time" },
  { name: "busType", label: "Bus type", placeholder: "AC Sleeper" },
  { name: "seatCount", label: "Seat count", type: "number", min: "0" },
  { name: "price", label: "Price", type: "number", min: "0" },
  { name: "amenities", label: "Amenities", placeholder: "Charging, Water bottle, Blanket", full: true },
];

function AddBus() {
  return (
    <VendorModuleForm
      module="bus"
      title="Bus"
      description="Create bus routes, seating inventory, amenities, and fare details."
      fields={fields}
    />
  );
}

export default AddBus;
