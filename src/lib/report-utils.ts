export function getShiftTime(shiftName: string, shiftDate: string) {
  const date = new Date(`${shiftDate}T00:00:00`);

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const formatDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const currentDate = formatDate(date);
  const followingDate = formatDate(nextDate);

  const shifts: Record<string, {
    FROM_DATE: string;
    FROM_TIME: string;
    TO_DATE: string;
    TO_TIME: string;
  }> = {
    A: {
      FROM_DATE: currentDate,
      FROM_TIME: "06:00:01",
      TO_DATE: currentDate,
      TO_TIME: "14:00:00",
    },
    B: {
      FROM_DATE: currentDate,
      FROM_TIME: "14:00:01",
      TO_DATE: currentDate,
      TO_TIME: "22:00:00",
    },
    C: {
      FROM_DATE: currentDate,
      FROM_TIME: "22:00:01",
      TO_DATE: followingDate,
      TO_TIME: "06:00:00",
    },
    ALL: {
      FROM_DATE: currentDate,
      FROM_TIME: "06:00:01",
      TO_DATE: followingDate,
      TO_TIME: "06:00:00",
    },
  };

  return shifts[shiftName] ?? null;
}