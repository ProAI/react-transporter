import TransporterNetwork from "./core/TransporterNetwork";
import TransporterClient from "./core/TransporterClient";
import Provider from "./react/Provider";
import withQuery from "./react/withQuery";
import createTransporterRequest from "./redux/createRequest";
import createTransporterSelector from "./redux/createSelector";

export default {
  TransporterNetwork, // core
  TransporterClient.createMiddleware(), // core
  // Transporter, // core, class to save infos from provider
  Provider, // react
  withQuery, // react
  createTransporterRequest, // redux
  createTransporterSelector, // redux
  transporterReducer // redux
  // redux/response responseBuilder
  // redux/updater updater
};
