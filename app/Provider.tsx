"use client";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import React, { createContext, useEffect, useState } from "react";

const Provider = ({ children }: any) => {
  const { user } = useUser();
  const [userDetails, setUserDetails] = useState<any>(null);
  const createUser = useMutation(api.user.createNewUser);
  const seedInterviewerTypes = useMutation(api.interviewerTypes.createDefaultTypes);

  const createNewUser = async () => {
    try {
      if (user) {
        const result = await createUser({
          name: user.fullName ?? "",
          imageUrl: user.imageUrl ?? "",
          email: user.primaryEmailAddress?.emailAddress ?? "",
        });
        setUserDetails(result);

        if (result.appUserId && result.organizationId) {
          await seedInterviewerTypes({
            actorUserId: result.appUserId,
            organizationId: result.organizationId,
          });
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  useEffect(() => {
    if (user && !userDetails) {
      void createNewUser();
    }
  }, [user, userDetails]);

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
