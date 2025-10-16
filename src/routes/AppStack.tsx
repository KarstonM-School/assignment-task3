import React, { useState } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

const { Navigator, Screen } = createStackNavigator();

import Login from "../pages/Login";
import EventsMap from "../pages/EventsMap";
import { AuthenticationContext, AuthenticationContextObject } from "../context/AuthenticationContext";
import { User } from "../types/User";
import AddEventMap from "../pages/AddEventMap";
import AddEventForm from "../pages/AddEventForm";
import EventDetails from "../pages/EventDetails";

export default function Routes() {
  const [authenticatedUser, setAuthenticatedUser] = useState<User>();

  const authenticationContextObj: AuthenticationContextObject = {
    value: authenticatedUser as User,
    setValue: setAuthenticatedUser,
  };

  return (
    <AuthenticationContext.Provider value={authenticationContextObj}>
      <NavigationContainer>
        <Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "#F2F3F5" },
          }}
        >
          <Screen name="Login" component={Login} />

          <Screen name="EventsMap" component={EventsMap} />
          <Screen name="EventDetails" component={EventDetails} />
          <Screen name="AddEventMap" component={AddEventMap} />
          <Screen name="AddEventForm" component={AddEventForm} />
        </Navigator>
      </NavigationContainer>
    </AuthenticationContext.Provider>
  );
}
