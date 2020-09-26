import React from "react";
import { InfoLogEvent } from "./types";

interface Props {
  events: InfoLogEvent[];
}

export const EventLog = ({ events }: Props) => {
  if (events.length === 0) {
    return <div>No events have yet been logged.</div>;
  }

  return (
    <div style={{ overflowY: "auto", height: "200px" }}>
      <table className="tableAuto">
        <tbody>
          {events.map((event, index) => {
            const shadeClass = index % 2 ? " bg-gray-100" : "";

            return (
              <tr key={event.isoTimestamp + "-" + event.message}>
                <td className={"px-4" + shadeClass}>{event.isoTimestamp}</td>
                <td className={"px-4" + shadeClass}>{event.source}</td>
                <td className={"px-4" + shadeClass}>{event.message}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
