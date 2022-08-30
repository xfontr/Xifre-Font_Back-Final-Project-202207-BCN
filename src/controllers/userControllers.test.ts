import { NextFunction, Request, Response } from "express";
import { User } from "../database/models/User";
import signUpSchema from "../schemas/signUpSchema";
import mockUser from "../test-utils/mocks/mockUser";
import CreateError from "../utils/CreateError/CreateError";
import prepareToken from "../utils/prepareToken/prepareToken";
import { ILoginData } from "./types/userControllers";
import { logIn, signUp } from "./userControllers";

jest.mock("../utils/auth/auth", () => ({
  ...jest.requireActual("../utils/auth/auth"),
  hashCreate: () => jest.fn().mockReturnValue("#"),
  createToken: () => "#",
  hashCompare: () => jest.fn().mockReturnValue(true),
}));

const mockJoiValidationError = () =>
  signUpSchema.validate(
    {},
    {
      abortEarly: false,
    }
  );

describe("Given a signUp function (controller)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const { name, password, email } = mockUser;
  const status = 200;

  const req = {
    body: { name, password, email },
  } as Partial<Request>;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response>;

  const next = jest.fn() as NextFunction;

  User.create = jest.fn().mockReturnValue(mockUser);

  describe("When called with a request, a response and a next function as arguments", () => {
    test("It should call status with a code of 200", async () => {
      await signUp(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(status);
    });

    test("It should respond with a new user as a body", async () => {
      const expectedBody = {
        newUser: mockUser,
      };

      await signUp(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(expectedBody);
    });

    test("It should respond with an error if something goes wrong when hashing the password or creating", async () => {
      const errorMessage = "Error message";
      User.create = jest.fn().mockRejectedValue(new Error(errorMessage));

      const expectedError = new CreateError(
        400,
        "User did not provide email, name or password",
        errorMessage
      );

      await signUp(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expectedError);

      const nextCalled = (next as jest.Mock<any, any>).mock.calls[0][0];
      expect(nextCalled.privateMessage).toBe(errorMessage);
    });

    test("It should respond with an error if the request did not provide a valid user", async () => {
      const invalidReq = {
        body: {},
      } as Partial<Request>;

      const expectedError = new CreateError(
        404,
        "User did not provide email, name or password",
        Object.values(mockJoiValidationError().error.message).join("")
      );

      await signUp(invalidReq as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expectedError);
      const nextCalled = (next as jest.Mock<any, any>).mock.calls[0][0];

      expect(nextCalled.privateMessage).toBe(
        Object.values(mockJoiValidationError().error.message).join("")
      );
    });
  });
});

describe("Given a log in function (controller)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const status = 200;

  const mockLoginData: ILoginData = {
    name: mockUser.name,
    password: mockUser.password,
  };

  const req = {
    body: mockLoginData,
  } as Partial<Request>;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response>;

  const next = jest.fn() as NextFunction;

  User.find = jest.fn().mockReturnValue([mockUser]);

  describe("When called with a request, a response and a next function as arguments", () => {
    test("It should call status with a code of 200", async () => {
      await logIn(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(status);
    });

    test("It should prepare a token with the logged in user", async () => {
      await logIn(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(prepareToken(mockUser));
    });
  });
});
