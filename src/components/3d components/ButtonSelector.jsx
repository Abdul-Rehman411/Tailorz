// components/ButtonSelector.js
import Image from "next/image";

const buttonTextures = [
  { id: 1, src: "/models/buttons/button1.jpeg" },
  { id: 2, src: "/models/buttons/button2.jpeg" },
  { id: 3, src: "/models/buttons/button3.jpg" },
  { id: 4, src: "/models/buttons/button4.jpg" },
  { id: 5, src: "/models/buttons/button5.jpg" },
  { id: 6, src: "/models/buttons/button6.jpeg" },
  { id: 7, src: "/models/buttons/button7.png" },
  { id: 8, src: "/models/buttons/button8.png" },
  { id: 9, src: "/models/buttons/button9.jpeg" },
  { id: 10, src: "/models/buttons/button10.jpeg" },
];

const ButtonSelector = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-4">
      {buttonTextures.map((btn) => (
        <div key={btn.id}>
          <Image
            src={btn.src}
            alt={`Button ${btn.id}`}
            width={64}
            height={64}
            className="rounded-full border-2 border-gray-300 hover:border-black hover:scale-[130%] cursor-pointer transition-all"
            onClick={() => onSelect(btn.src)}
          />
        </div>
      ))}
    </div>
  );
};

export default ButtonSelector;
