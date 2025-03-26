const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Educator = require("../models/Educator");

router.get("/", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (user) {
      req.session.user = user;

      switch (user.role) {
        case "educator":
          const educator = await Educator.findOne({ email: user.email });
          if (educator) {
            res.redirect(`/educator/${educator._id}/dashboard`);
          } else {
            res.render("login", { error: "Educator not found" });
          }
          break;
        case "admin":
          res.redirect("/admin/dashboard");
          break;
        case "student":
          res.redirect("/student/dashboard");
          break;
        default:
          res.render("login", { error: "Invalid role" });
      }
    } else {
      res.render("login", { error: "Invalid credentials" });
    }
  } catch (error) {
    res.render("login", { error: "Login failed" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const Educator = require("../models/Educator");

// router.get("/", (req, res) => {
//   res.render("login");
// });

// // router.post('/login', async (req, res) => {
// //   try {
// //     const { email, password, role } = req.body;
// //     const user = await User.findOne({ email, password, role });

// //     if (user) {
// //       req.session.user = user;
// //       switch (user.role) {
// //         case 'admin':
// //           res.redirect('/admin/dashboard');
// //           break;
// //           case 'educator':
// //            // const educator= await Educator.findOne({email:user.email});
// //             res.redirect(`/educator/dashboard`); // Redirect with educatorId
// //           break;
// //         case 'student':
// //           res.redirect('/student/dashboard');
// //           break;
// //       }
// //     } else {
// //       res.render('login', { error: 'Invalid credentials' });
// //     }
// //   } catch (error) {
// //     res.render('login', { error: 'Login failed' });
// //   }
// // });

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password, role } = req.body;
//     const user = await User.findOne({ email, password, role });

//     if (user) {
//       req.session.user = user;

//       if (user.role === "educator") {
//         const educator = await Educator.findOne({ email: user.email });
//         if (educator) {
//           res.redirect(`/educator/${educator._id}/dashboard`); // Redirect with educatorId
//         } else {
//           res.render("login", { error: "Educator not found" });
//         }
//       } else if (user.role === "admin") {
//         res.redirect("/admin/dashboard");
//       } else if (user.role === "student") {
//         res.redirect("/student/dashboard");
//       }
//     } else {
//       res.render("login", { error: "Invalid credentials" });
//     }
//   } catch (error) {
//     res.render("login", { error: "Login failed" });
//   }
// });

// router.get("/logout", (req, res) => {
//   req.session.destroy();
//   res.redirect("/");
// });

// module.exports = router;
