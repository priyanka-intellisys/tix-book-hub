import React from "react";
import VendorModuleForm from "./VendorModuleForm";
import "./AddFlight.css";

const fields = [
  { name: "airlineName", label: "Airline name" },
  { name: "flightNumber", label: "Flight number" },
  { name: "fromAirport", label: "From airport" },
  { name: "toAirport", label: "To airport" },
  { name: "departureDate", label: "Departure date", type: "date" },
  { name: "departureTime", label: "Departure time", type: "time" },
  { name: "arrivalTime", label: "Arrival time", type: "time" },
  { name: "duration", label: "Duration", placeholder: "2h 15m" },
  { name: "cabinClass", label: "Cabin class", placeholder: "Economy, Business" },
  { name: "price", label: "Price", type: "number", min: "0" },
  { name: "availableSeats", label: "Available seats", type: "number", min: "0" },
  { name: "baggageInfo", label: "Baggage info" },
  { name: "cancellationPolicy", label: "Cancellation policy", type: "textarea", full: true },
];

function AddFlight() {
  return (
    <VendorModuleForm
      module="flight"
      title="Flight"
      description="Configure flight inventory and fare details for customers."
      fields={fields}
    />
  );
}

export default AddFlight;
