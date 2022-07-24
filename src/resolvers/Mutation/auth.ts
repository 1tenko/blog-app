import { Context } from "../../index";
import validator from "validator";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import { JSON_SIGNATURE } from "../../keys";

interface SignupArgs {
  email: string;
  name: string;
  bio: string;
  password: string;
}

interface UserPayload {
  userErrors: {
    message: string;
  }[];
  token: string | null;
}

export const authResolvers = {
  signup: async (
    _: any,
    { email, name, password, bio }: SignupArgs,
    { prisma }: Context
  ): Promise<UserPayload> => {
    const isEmail = validator.isEmail(email);

    if (!isEmail) {
      return {
        userErrors: [
          {
            message: "invalid email",
          },
        ],
        token: null,
      };
    }

    const isValidPassword = validator.isLength(password, {
      min: 5,
    });

    if (!isValidPassword) {
      return {
        userErrors: [
          {
            message: "invalid password",
          },
        ],
        token: null,
      };
    }

    if (!name || !bio) {
      return {
        userErrors: [
          {
            message: "invalid name or bio",
          },
        ],
        token: null,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    await prisma.profile.create({
      data: {
        bio,
        userID: user.id,
      },
    });

    const token = await JWT.sign(
      {
        userId: user.id,
      },
      JSON_SIGNATURE,
      {
        expiresIn: 3600000,
      }
    );

    return {
      userErrors: [],
      token,
    };
  },
};
