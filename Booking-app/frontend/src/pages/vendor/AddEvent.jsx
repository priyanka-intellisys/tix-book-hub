import React from "react";
import VendorModuleForm from "./VendorModuleForm";
import "./AddEvent.css";

const fields = [
  { name: "eventTitle", label: "Event title" },
  { name: "city", label: "City" },
  { name: "venue", label: "Venue" },
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time", type: "time" },
  { name: "ticketPrice", label: "Ticket price", type: "number", min: "0" },
  { name: "totalTickets", label: "Total tickets", type: "number", min: "0" },
  { name: "bannerImageUrl", label: "Banner image URL", full: true },
];

function AddEvent() {
  return (
    <VendorModuleForm
      module="event"
      title="Event"
      description="Publish event ticket inventory with city, venue, date, and pricing."
      fields={fields}
    />
  );
}

export default AddEvent;
