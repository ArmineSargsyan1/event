(async () => {
  const token = localStorage.getItem('token');

  console.log(token)

  if (!token) {
    location.href = "/users/views/login"
  } else {
    const data = await axios({
      method: 'get',
      url: '/users/profile',
      headers: {
        Authorization: `${token}`
      }
    })
      .then((res) => {
        return { success: true, data: res.data };
      })
      .catch((err) => {
        return { success: false, data: err };
      });

    if (!data.success) {
      location.href = "/users/views/login"
    }

    console.log(data)
  }
})();
