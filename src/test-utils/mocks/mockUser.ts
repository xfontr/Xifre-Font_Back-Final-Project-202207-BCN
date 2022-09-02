import IUser from "../../database/types/IUser";

const mockUser: IUser = {
  id: "userId",
  name: "longusername",
  password: "longpassword123",
  email: "user@email.com",
  contacts: ["contact_one", "contact_two"],
};

export default mockUser;
