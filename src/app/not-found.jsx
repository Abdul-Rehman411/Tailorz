"use client";
import React, { useContext } from "react";
import Link from "next/link";
import UserContext from "@/utils/UserContext";
import SimpleButton from "@/components/SimpleButton";

const funkySentences = [
  "Oops! You seem lost. How about you you go back where you came from?",
  "This page took a vacation.",
  "Not all who wander are lost, but you might be!",
  "Uh-oh, you've reached the void.",
  "Nothing to see here, move along.",
  "The page you requested is currently binge-watching Netflix. Try again later!",
  "The page you're looking for is out chasing unicorns.",
  "Congratulations! You've met Blorpy, the Imaginary Page Guardian. Unfortunately, Blorpy is terrible with directions and has led you to a 404 error!",
  "Whoa! You've stumbled upon Blorpy, the Mischievous Byte Goblin. Blorpy loves to snack on pages, and it looks like this one was his latest meal!",
];

const getRandomSentence = () => {
  return funkySentences[Math.floor(Math.random() * funkySentences.length)];
};

const NotFoundPage = () => {
  const { theme } = useContext(UserContext);
  return (
    <main
      className={`max-w-[99.5%] mx-auto h-screen my-4 md:my-1 rounded-lg w-full flex flex-col justify-center items-center ${theme.mainTheme}`}
    >
      <h1 className={"text-9xl font-extrabold tracking-widest"}>404</h1>
      <div className={"px-2 rounded rotate-12 absolute text-red-700"}>
        Page Not Found
      </div>
      <p className={"mt-5"}>{getRandomSentence()}</p>
      <Link href="/">
        <SimpleButton
          btnText={"Go Home"}
          type={"primary"}
          extraclasses={"mt-8 py-3"}
        />
      </Link>
    </main>
  );
};

export default NotFoundPage;
