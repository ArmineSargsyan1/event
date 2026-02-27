const registrationForm = document.querySelector('#registration_form');

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
      localStorage.removeItem('userData');
    }
  }
})();

if (registrationForm) {
  registrationForm.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData.entries());

    console.log(formObject);

    await axios({
      method: 'post',
      url: '/users/registration',
      data: {
        ...formObject,
      },
    }).then(handlerSuccess)
      .catch(handlerError);
  }
}


function handlerSuccess(data) {
  console.log({ data });
  Toastify({
    text: e?.response?.data.message,
    duration: 2000,
    close: true,
    className: 'success',
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
  }).showToast();
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
  }else {
    Toastify({
      text: e?.response?.data.message,
      duration: 2000,
      close: true,
      className: 'error',
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
  }

  return { data: null };
}
