import randomString from './randomString.js';

/**
 * 生成用户id，并修改title
 * @param { string } element
 */
function getUserId(element) {
  const id = randomString();
  const myIdView = document.getElementById(element);

  myIdView && (myIdView.innerText = id);
  document.title = `${ document.title } ( ${ id } )`;

  return id;
}

export default getUserId;