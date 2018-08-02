import Vue from "vue";
import Router from "vue-router";
import Home from "@/components/Home";
import Meetups from "@/components/Meetup/Meetups";
import CreateMeetup from "@/components/Meetup/CreateMeetup";
import Profile from "@/components/User/Profile";
import Login from "@/components/User/Login";
import Signup from "@/components/User/Signup";
import Meetup from "@/components/Meetup/Meetup";
import AuthGuard from "./auth-guard";

Vue.use(Router);

export default new Router({
   routes: [
      {
         path: "/",
         name: "Home",
         component: Home
      },
      {
         path: "/meetups",
         name: "Meetups",
         component: Meetups
      },
      {
         path: "/meetup/new",
         name: "CreateMeetup",
         component: CreateMeetup,
         beforeEnter: AuthGuard
      },
      {
         path: "/meetups/:id",
         name: "Meetup",
         component: Meetup,
         props: true
      },
      {
         path: "/profile",
         name: "Profile",
         component: Profile
      },
      {
         path: "/login",
         name: "Login",
         component: Login
      },
      {
         path: "/signup",
         name: "Signup",
         component: Signup
      }
   ],
   mode: "history"
});
