import z from "zod";

export const RegisterSchema = z.object({
    name: z.string().nonempty({message: "Name cannot be empty"}),
    email: z.string().nonempty({message: "Email cannot be empty"}).email({message: "Email should be valid"}),
    password: z.string().nonempty({message: "Password cannot be empty"})
})