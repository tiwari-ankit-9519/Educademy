import { controllerTrackingMiddleware } from "./morgan.js";

export const trackRoute = (controllerName, methodName) => {
  return controllerTrackingMiddleware(controllerName, methodName);
};
