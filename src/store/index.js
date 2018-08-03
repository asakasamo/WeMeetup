import Vue from "vue";
import Vuex from "vuex";
import firebase from "firebase";

Vue.use(Vuex);

export const store = new Vuex.Store({
   state: {
      loadedMeetups: [], // TODO: Dummy data?
      user: null,
      loading: false,
      error: null
   },
   mutations: {
      /**
       * Registers the current user for a given meetup
       * @param {Object} state
       * @param {Object} payload the meetup
       */
      registerUserForMeetup(state, payload) {
         const meetupid = payload.id;
         if (
            state.user.registeredMeetups.findIndex(
               (meetup) => meetup.id === meetupid
            ) >= 0
         ) {
            return;
         }

         // store the meetup id
         state.user.registeredMeetups.push(meetupid);

         // store the firebase reference to the meetup registration
         state.user.fbRegistrationKeys[meetupid] = payload.fbRegistrationKey;
      },

      /**
       * Unregisters a the current user from a given meetup
       * @param {Object} state
       * @param {string} payload the meetup id
       */
      unregisterUserFromMeetup(state, payload) {
         const registeredMeetups = state.user.registeredMeetups;

         // Remove the registered meetup from the registeredMeetups array
         registeredMeetups.splice(
            registeredMeetups.findIndex((meetup) => meetup.id === payload),
            1
         );

         // Delete the firebase reference to the meetup registration
         Reflect.deleteProperty(state.user.fbRegistrationKeys, payload);
      },

      setLoadedMeetups(state, payload) {
         state.loadedMeetups = payload;
      },
      /**
       * Adds a new meetup to the store
       * @param {Object} state
       * @param {Object} payload The new meetup object
       */
      createMeetup(state, payload) {
         state.loadedMeetups.push(payload);
         console.log(payload);
      },

      /**
       * Updats a given meetup
       * @param {Object} state
       * @param {Object} payload
       */
      updateMeetup(state, payload) {
         const meetup = state.loadedMeetups.find((mu) => mu.id === payload.id);

         // only update if updates are available
         meetup.title = payload.title || meetup.title;
         meetup.description = payload.description || meetup.description;
         meetup.date = payload.date || meetup.date;
      },

      /**
       * Sets the current active user
       * @param {Object} state
       * @param {Object} payload
       */
      setUser(state, payload) {
         state.user = payload;
      },

      /**
       * Sets the loading state
       * @param {Object} state
       * @param {boolean} payload
       */
      setLoading(state, payload) {
         state.loading = payload;
      },

      /**
       * Sets the error state
       * @param {Object} state
       * @param {Object} payload
       */
      setError(state, payload) {
         state.error = payload;
      },

      /**
       * Clears the error state
       * @param {Object} state
       */
      clearError(state) {
         state.error = null;
      }
   },
   actions: {
      /**
       * Registers a user for a meetup
       * @param {Object} commit
       * @param {Object} payload the meetup id
       */
      registerUserForMeetup({ commit, getters }, payload) {
         commit("setLoading", true);
         const user = getters.user;

         firebase
            .database()
            .ref("/users/" + user.id)
            .child("/registrations/")
            .push(payload) // add the meetup to /users/registrations/
            .then((data) => {
               commit("registerUserForMeetup", {
                  id: payload,
                  fbRegistrationKey: data.key // the firebase id of the registration
               });
               commit("setLoading", false);
            })
            .catch((error) => {
               commit("setLoading", false);
               console.log(error);
            });
      },
      /**
       * Unregisters a user from a meetup
       */
      unregisterUserFromMeetup({ commit, getters }, payload) {
         commit("setLoading", true);
         const user = getters.user;

         if (!user.fbRegistrationKeys) {
            return;
         }
         const fbRegistrationKey = user.fbRegistrationKeys[payload];
         firebase.database
            .ref("/users/" + user.id + "/registrations") // go to the registration
            .child(fbRegistrationKey)
            .remove() // remove the registration from the database
            .then(() => {
               commit("unregisterUserFromMeetup", payload);
               commit("setLoading", false);
            })
            .catch((error) => {
               console.log(error);
            });
      },
      /**
       * Preloads meetups from the database
       * @param {Object} commit
       */
      loadMeetups({ commit }) {
         commit("setLoading", true);
         firebase
            .database()
            .ref("meetups")
            .once("value")
            .then((data) => {
               const meetups = [];
               const obj = data.val();
               for (let key in obj) {
                  meetups.push({
                     id: key,
                     title: obj[key].title,
                     location: obj[key].location,
                     description: obj[key].description,
                     imageURL: obj[key].imageURL,
                     date: obj[key].date,
                     creatorId: obj[key].creatorId
                  });
               }
               commit("setLoadedMeetups", meetups);
               commit("setLoading", false);
            })
            .catch((error) => {
               console.log(error);
               commit("setLoading", false);
            });
      },
      /**
       * Creates a new user
       */
      createMeetup({ commit, getters }, payload) {
         const meetup = {
            title: payload.title,
            location: payload.location,
            imageURL: payload.imageURL,
            description: payload.description,
            date: payload.date.toISOString(),
            creatorId: getters.user.id
         };
         // Reach out to firebase and store it
         let key, refPath;
         firebase
            .database()
            .ref("meetups")
            .push(meetup) // store the meetup in the database
            .then((data) => {
               // get the new meetup's key
               key = data.key;
               const filename = payload.image.name;
               const extension = filename.slice(filename.lastIndexOf("."));

               // store the file in firebase storage as {id}.{extension}
               refPath = "meetups/" + key + extension;
               return firebase
                  .storage()
                  .ref(refPath)
                  .put(payload.image);
            })
            .then(() =>
               // fetch the image URL
               firebase
                  .storage()
                  .ref(refPath)
                  .getDownloadURL()
            )
            .then((imageURL) =>
               // update the database reference with the url
               firebase
                  .database()
                  .ref("meetups")
                  .child(key)
                  .update({ imageURL })
            )
            .then(() => {
               // commit the changes to the local store
               commit("createMeetup", { ...meetup, key });
            })
            .catch((error) => {
               console.log(error);
            });

         commit("createMeetup", meetup);
      },

      /**
       * Updates a meetup (i.e. from the Edit Meetup component)
       * @param {Object} commit
       * @param {Object} payload
       */
      updateMeetupData({ commit }, payload) {
         commit("setLoading", true);

         const updateObj = {};
         if (payload.title) {
            updateObj.title = payload.title;
         }
         if (payload.description) {
            updateObj.description = payload.description;
         }
         if (payload.date) {
            updateObj.date = payload.date;
         }

         // update the meetup in firebase
         firebase
            .database()
            .ref("meetups")
            .child(payload.id)
            .update(updateObj)
            .then(() => {
               // update the local store
               commit("updateMeetup", payload);
               commit("setLoading", false);
            })
            .catch((error) => {
               commit("setLoading", false);
               console.log(error);
            });
      },

      /**
       * Signs up a new user using firebase
       * @param {Object} commit
       * @param {Object} payload { email, password }
       */
      signUserUp({ commit }, payload) {
         commit("setLoading", true);
         commit("clearError");
         firebase
            .auth()
            .createUserWithEmailAndPassword(payload.email, payload.password)
            .then((userCredential) => {
               const newUser = {
                  id: userCredential.user.uid,
                  registeredMeetups: [],
                  fbRegistrationKeys: {}
               };
               commit("setUser", newUser);
               commit("setLoading", false);
            })
            .catch((error) => {
               commit("setLoading", false);
               commit("setError", error);
               console.log(error);
            });
      },

      /**
       * Logs a user in
       * @param {Object} commit
       * @param {Object} payload { email, password }
       */
      logUserIn({ commit }, payload) {
         commit("setLoading", true);
         commit("clearError");
         firebase
            .auth()
            .signInWithEmailAndPassword(payload.email, payload.password)
            .then((userCredential) => {
               const newUser = {
                  id: userCredential.user.uid,
                  registeredMeetups: [],
                  fbRegistrationKeys: {}
               };
               commit("setUser", newUser);
               commit("setLoading", false);
            })
            .catch((error) => {
               commit("setLoading", false);
               commit("setError", error);
               console.log(error);
            });
      },

      fetchUserData({ commit, getters }) {
         commit("setLoading", true);

         // fetch registered meetups
         firebase
            .database()
            .ref("/users/" + getters.user.id + "/registrations/")
            .once("value")
            .then((data) => {
               commit("setLoading", true);

               const registrations = data.val();
               let registeredMeetups = [];
               let fbRegistrationKeys = {};

               for (let key in registrations) {
                  registeredMeetups.push(registrations[key]);
                  fbRegistrationKeys[registrations[key]] = key;
               }

               const updatedUser = {
                  id: getters.user.id,
                  registeredMeetups,
                  fbRegistrationKeys
               };

               commit("setUser", updatedUser);
               commit("setLoading", false);
            })
            .catch((error) => {
               console.log(error);
            });
      },

      /**
       * Clears the error state
       */
      clearError({ commit }) {
         commit("clearError");
      },

      /**
       * Automaticaly logs in the user
       * @param {Object} commit
       * @param {Object} payload
       */
      autoLogIn({ commit }, payload) {
         commit("setUser", {
            id: payload.uid,
            registeredMeetups: [],
            fbRegistrationKeys: {}
         });
      },

      /**
       * Logs the user out
       * @param {Object} commit
       */
      logOut({ commit }) {
         firebase.auth().signOut();
         commit("setUser", null);
      }
   },
   getters: {
      /**
       * Returns the meetups loaded into the store
       * @param {Object} state
       */
      loadedMeetups(state) {
         return state.loadedMeetups.sort(
            (meetup1, meetup2) => meetup1.date > meetup2.date
         );
      },

      /**
       * Returns the first 5 meetups
       * @param {Object} state
       */
      featuredMeetups(state, getters) {
         return getters.loadedMeetups.slice(0, 5);
      },

      /**
       * Returns the current loaded meetup
       * @param {Object} state
       */
      loadedMeetup(state) {
         return (meetupId) =>
            state.loadedMeetups.find((meetup) => meetup.id === meetupId);
      },

      user(state) {
         return state.user;
      },

      error(state) {
         return state.error;
      },

      loading(state) {
         return state.loading;
      }
   }
});
