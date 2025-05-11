import React from "react";

const ProgressBar = ({ steps, currentStep, stepNames }) => {
  // Width for each step in percent
  const stepWidth = 100 / (steps - 2);

  return (
    <div className="w-3/5 md:3/6 lg:w-6/12 mx-auto my-4 select-none z-20">
      <div className="relative flex items-center z-20">
        {/* Line for the progress */}
        <div className="absolute w-full bg-gray-200" />

        {Array.from({ length: steps }, (_, i) => (
          <div
            key={i}
            className="relative flex items-center"
            style={{ width: i === steps - 1 ? "auto" : `${stepWidth}%` }}
          >
            {/* Step Circle */}
            <div
              className={`${
                currentStep > i ? "bg-green-600" : "bg-gray-300"
              } h-6 w-6 rounded-full shadow flex items-center justify-center px-1`}
              style={{ zIndex: 1 }}
            >
              {currentStep > i ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon icon-tabler icon-tabler-check"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="#FFFFFF"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <path d="M5 12l5 5l10 -10" />
                </svg>
              ) : null}
            </div>

            {/* Progress Line for each completed step */}
            {i < steps - 1 && (
              <div
                className={`${
                  currentStep > i + 1 ? "bg-green-600" : "bg-gray-300"
                } h-1`}
                style={{ width: `${stepWidth}%` }}
              />
            )}

            {/* Step Label */}
            {currentStep === i + 1 && (
              <div
                className="absolute top-8 text-center text-sm font-semibold bg-gray-300 rounded-lg p-1"
                style={{
                  left: "5%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                }}
              >
                {stepNames[i]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
