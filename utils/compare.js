const compare = (current, previous) => {
  if (!previous || previous === 0) {
    return {
      direction: "up",
      percentage: 100,
    };
  }

  const diff = ((current - previous) / previous) * 100;

  console.log("diff :", diff);

  return {
    direction: diff >= 0 ? "up" : "down",
    percentage: Math.abs(Number(diff.toFixed(2))),
  };
};

module.exports = compare;
