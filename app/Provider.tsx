"use client";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import React, { createContext, useState } from "react";
import { useEffect } from "react";

const Provider = ({ children }: any) => {
  // Fetch user details from clerk
  const { user } = useUser();
  useEffect(() => {
    user && createNewUser();
  }, [user]);

  const [userDetails, setUserDetails] = useState<any>(null);

  // Use the createNewUser mutation from the Convex API
  const createUser = useMutation(api.user.createNewUser);

  const createNewUser = async () => {
    try {
      if (user) {
        const result = await createUser({
          name: user.fullName ?? "",
          imageUrl: user.imageUrl ?? "",
          email: user.primaryEmailAddress?.emailAddress ?? "",
        });
        setUserDetails(result);
        console.log("User created:", result);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };
  return (
    <UserDetailsContext.Provider value={{ userDetails, setUserDetails }}>
      <div>{children}</div>
    </UserDetailsContext.Provider>
  );
};

export default Provider;

export const useUserDetails = () => {
  return createContext(UserDetailsContext);
};
