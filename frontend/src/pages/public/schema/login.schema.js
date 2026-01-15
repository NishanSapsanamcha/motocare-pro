import z from "zod";

export const LoginSchema = z.object({
    email:z.
    string()
    .nonempty({message: "Email cannot be empty"})
    .email({message: "Email should be valid"}),

    password: z.string().nonempty({message: "Password cannot be null"})
})