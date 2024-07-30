const { z } = require("zod");

const Password = z.string().min(4, "please enter longer than 4");
console.log(Password.safeParse("123").error?.message);

const Email = z.string().email("Please enter a valid email");
console.log(Email.safeParse("123").error?.message);
console.log(Email.parse("someone@openavenues.org"));

const MoreThan25LessThan100 = z.number().min(25).max(100);
console.log(MoreThan25LessThan100.safeParse(24).error?.message);
console.log(MoreThan25LessThan100.parse(25));
console.log(MoreThan25LessThan100.parse(100));
console.log(MoreThan25LessThan100.safeParse(101).error?.message);

const Apartment = z.object({
  unit: z.string(),
  sqft: z.number(),
});
console.log(
  Apartment.parse({
    unit: "Apt 203",
    sqft: 600,
  })
);

const Apartment2 = z.object({
  unit: z.string(),
  sqft: z.coerce.number(),
});
console.log(
  Apartment2.parse({
    unit: "Apt 203",
    sqft: "600",
  })
);

const Attendance = z
  .object({
    attended: z.coerce.boolean(),
    date: z.string().date(),
  })
  .array();
console.log(
  JSON.stringify(
    Attendance.parse([
      { attended: "false", date: "2024-07-10" },
      { attended: "true", date: "2024-07-17" },
    ]),
    null,
    2
  )
);

const Student = z.object({
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  age: z.nullable(),
});
console.log(
  JSON.stringify(
    Student.parse({
      firstName: "Dennis",
      lastName: "Lim",
      age: null,
    }),
    null,
    2
  )
);
