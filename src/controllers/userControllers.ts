import "../loadEnvironment";
import { NextFunction, Request, Response } from "express";
import { IRegisterData, ILoginData } from "./types/userControllers";
import CreateError from "../utils/CreateError/CreateError";
import { hashCompare, hashCreate } from "../utils/auth/auth";
import { User } from "../database/models/User";
import IUser from "../database/types/IUser";
import prepareToken from "../utils/prepareToken/prepareToken";
import signUpSchema from "../schemas/signUpSchema";
import logInSchema from "../schemas/logInSchema";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const registerData: IRegisterData = req.body;

  try {
    const validationResult = signUpSchema.validate(registerData, {
      abortEarly: false,
    });

    if (validationResult.error) {
      throw new Error(Object.values(validationResult.error.message).join(""));
    }

    (validationResult.value as IRegisterData).password = await hashCreate(
      registerData.password
    );

    const newUser = await User.create({
      name: (validationResult.value as IRegisterData).name,
      email: (validationResult.value as IRegisterData).email,
      password: (validationResult.value as IRegisterData).password,
    });

    res.status(200).json({ newUser });
  } catch (error) {
    const newError = new CreateError(
      404,
      "User did not provide email, name or password",
      error.message
    );
    next(newError);
  }
};

export const logIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loginData: ILoginData = req.body;

  let dbUser: IUser[];
  let validationResult: any;

  try {
    validationResult = logInSchema.validate(loginData, {
      abortEarly: false,
    });

    if (validationResult.error) {
      throw new Error(Object.values(validationResult.error.message).join(""));
    }
  } catch (error) {
    const newError = new CreateError(
      400,
      "Invalid username or password",
      error.message
    );
    next(newError);
  }

  try {
    dbUser = await User.find({
      name: (validationResult.value as ILoginData).name,
    });

    if (!dbUser.length) {
      throw new Error();
    }
  } catch (error) {
    const newError = new CreateError(
      404,
      "Invalid username or password",
      "User not found"
    );
    next(newError);
    return;
  }

  try {
    const isPasswordCorrect = await hashCompare(
      loginData.password,
      dbUser[0].password
    );

    if (!isPasswordCorrect) {
      throw new Error();
    }
  } catch (error) {
    const newError = new CreateError(
      400,
      "Invalid username or password",
      "Invalid password"
    );

    next(newError);
    return;
  }

  res.status(200).json(prepareToken(dbUser[0]));
};

export const getUserData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;

  let dbUser: IUser;

  try {
    dbUser = await User.findById(userId);

    res.status(200).json({ user: dbUser });
  } catch (error) {
    const newError = new CreateError(
      404,
      "Bad request",
      `Requested user does not exist: ${error.message}`
    );

    next(newError);
  }
};
