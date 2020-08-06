// Takes two arrays and combines them into a single array of objects
// Each object contains a left/right value corresponding to the given array type or undefined.
export function combineArrays<L, R>(leftArray: L[], rightArray: R[]) {
  const combined: Array<Partial<{ left: L; right: R }>> = [];
  const largestLength = Math.max(leftArray.length, rightArray.length);

  for (let i = 0; i < largestLength; i++) {
    combined.push({ left: leftArray[i], right: rightArray[i] });
  }

  return combined;
}
