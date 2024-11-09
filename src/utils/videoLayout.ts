export function getVideoPosition(memberId: string, memberNum: number) {
  /**
   * 1. 1人时，默认为正中心
   * 2. 2人时，host左，1人右
   * 3. 3人时，host左，2人平分右
   * 4. 4人时，2人左，host左上，2人右
   */
  let res = {
    top: 0,
    left: 0,
    w: 0,
    h: 0,
  };
  const videoContainer = document.querySelector("#video-container");
  if (!videoContainer) return res;
  const { width, height } = videoContainer.getBoundingClientRect();

  if (memberNum === 1) {
    // 只能是host，videoContainer下最大的16:9
    res = { ...biggestRectangleInside(width, height, 0, 0) };
  } else if (memberNum === 2) {
    if (memberId === "member0") {
      // host
      res = { ...biggestRectangleInside(width / 2, height, 0, 0) };
    } else {
      res = { ...biggestRectangleInside(width / 2, height, width / 2, 0) };
    }
  } else if (memberNum === 3) {
    if (memberId === "member0") {
      // host
      res = { ...biggestRectangleInside(width / 2, height, 0, 0) };
    } else if (memberId === "member1") {
      res = { ...biggestRectangleInside(width / 2, height / 2, width / 2, 0) };
    } else {
      res = {
        ...biggestRectangleInside(width / 2, height / 2, width / 2, height / 2),
      };
    }
  } else if (memberNum === 4) {
    if (memberId === "member0") {
      // host
      res = { ...biggestRectangleInside(width / 2, height / 2, 0, 0) };
    } else if (memberId === "member1") {
      res = { ...biggestRectangleInside(width / 2, height / 2, width / 2, 0) };
    } else if (memberId === "member2") {
      res = {
        ...biggestRectangleInside(width / 2, height / 2, 0, height / 2),
      };
    } else {
      res = {
        ...biggestRectangleInside(width / 2, height / 2, width / 2, height / 2),
      };
    }
  }
  return res;
}

/**
 * 获取一个大矩形内最大16:9小矩形的absolute定位的top、left值
 * @param w 矩形width
 * @param h 矩形height
 * @param x 矩形左上角坐标x
 * @param y 矩形左上角坐标y
 */
function biggestRectangleInside(w: number, h: number, x: number, y: number) {
  const res = {
    top: x,
    left: y,
    w: 0,
    h: 0,
  };
  if (w / h > 16 / 9) {
    res.top = y;
    res.left = (w - (h / 9) * 16) / 2 + x;
    res.h = h;
    res.w = (h / 9) * 16;
  } else {
    res.left = x;
    res.top = (h - (w / 16) * 9) / 2 + y;
    res.w = w;
    res.h = (w / 16) * 9;
  }

  return res;
}
