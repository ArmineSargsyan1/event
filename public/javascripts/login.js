const loginForm = document.querySelector('#login_form');

(async () => {
  const token = localStorage.getItem('token');

  if (token) {
    const data = await axios({
      method: 'get',
      url: '/users/profile',
      headers: {
        authorization: `${token}`
      }
    })
      .then((res) => {
        return { success: true, data: res.data };
      })
      .catch((err) => {
        return { success: false, data: err };
      });

    if (data.success) {
      location.href = "/users/views/profile"
    } else {
      localStorage.removeItem('token');
    }
  }
})();


if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData.entries());

    console.log(formObject);

    const { data } = await axios({
      method: 'post',
      url: '/users/login',
      data: {
        ...formObject,
      },
    }).catch(handlerError);

    if (data?.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data?.user || {}));
      location.href = `/users/views/profile`;
    }
  }
}


function handlerError(e) {
  const errors = e?.response?.data?.errors;
  if (errors) {
    const errorSpans = document.querySelectorAll('span[id^="error_"]');

    errorSpans.forEach((errorSpan) => {
      errorSpan.innerText = '';
    })

    for (const [key, value] of Object.entries(errors)) {
      if (typeof value !== 'object') {
        const span = document.querySelector(`span#error_${key}`);
        if (span) {
          span.innerText = value;
        }
      } else {
        for (const [key2, value2] of Object.entries(value)) {
          const span = document.querySelector(`span#error_${key2}`);
          if (span) {
            span.innerText = value2;
          }
        }
      }
    }
    return { data: errors };
  }

  return { data: null };
}

navigator.geolocation.getCurrentPosition((position) => {
  console.log(position)
});
