import { useState } from "react";

import {
  Search,
  Bell,
  Sparkles,
  ChevronDown
} from "lucide-react";

import {
  motion,
  AnimatePresence
} from "framer-motion";

import "./Navbar.css";

function Navbar({
  users,
  currentUserEmail,
  userSearch,
  setUserSearch,
  fetchConversation
}) {

  const [showProfile, setShowProfile] =
    useState(false);

  // FILTER USERS

  const filteredUsers = users.filter(
    (user) =>
      user.email
        ?.toLowerCase()
        .includes(
          userSearch.toLowerCase()
        )
  );

  return (

    <motion.div

      className="navbar"

      initial={{
        y: -50,
        opacity: 0
      }}

      animate={{
        y: 0,
        opacity: 1
      }}

      transition={{
        duration: 0.5
      }}
    >

      {/* LEFT */}

      <div className="navbar-left">

        <motion.div

          className="logo-icon"

          whileHover={{
            rotate: 10,
            scale: 1.1
          }}
        >

          <Sparkles size={18} />

        </motion.div>

        <h1 className="navbar-logo">
          Quantum Mail
        </h1>

      </div>

      {/* SEARCH */}

      <div className="navbar-search">

        <Search
          size={18}
          className="search-icon"
        />

        <input
          type="text"
          placeholder="Search users..."
          value={userSearch}
          onChange={(e) =>
            setUserSearch(
              e.target.value
            )
          }
        />

        {/* DROPDOWN */}

        <AnimatePresence>

          {
            userSearch && (

              <motion.div

                className="dropdown"

                initial={{
                  opacity: 0,
                  y: 10
                }}

                animate={{
                  opacity: 1,
                  y: 0
                }}

                exit={{
                  opacity: 0,
                  y: 10
                }}
              >

                {
                  filteredUsers.length > 0 ? (

                    filteredUsers.map(
                      (user) => (

                        <motion.div

                          key={user.id}

                          className="dropdown-item"

                          whileHover={{
                            x: 5,
                            scale: 1.02
                          }}

                          onClick={() => {

                            fetchConversation(
                              user.id
                            );

                            setUserSearch("");

                          }}
                        >

                          {/* AVATAR */}

                          <div className="dropdown-avatar">

                            {
                              user.email[0]
                                ?.toUpperCase()
                            }

                          </div>

                          {/* INFO */}

                          <div className="dropdown-info">

                            <h4>

                              {
                                user.email
                                  .split("@")[0]
                              }

                            </h4>

                            <p>
                              {user.email}
                            </p>

                          </div>

                        </motion.div>

                      )
                    )

                  ) : (

                    <div className="no-user">
                      No users found
                    </div>

                  )
                }

              </motion.div>

            )
          }

        </AnimatePresence>

      </div>

      {/* RIGHT */}

      <div className="navbar-right">

        {/* NOTIFICATION */}

        <motion.div

          className="nav-icon"

          whileHover={{
            y: -3,
            scale: 1.05
          }}
        >

          <Bell size={20} />

          <span className="notification-dot"></span>

        </motion.div>

        {/* PROFILE */}

        <div

          className="navbar-profile"

          onMouseEnter={() =>
            setShowProfile(true)
          }

          onMouseLeave={() =>
            setShowProfile(false)
          }
        >

          {/* AVATAR */}

          <motion.div

            className="profile-avatar"

            whileHover={{
              scale: 1.08
            }}
          >

            {
              currentUserEmail?.[0]
                ?.toUpperCase()
            }

            <span className="online-ring"></span>

          </motion.div>

          {/* INFO */}

          <div className="profile-info">

            <h4>

              {
                currentUserEmail
                  ?.split("@")[0]
              }

            </h4>

            <p>
              Online
            </p>

          </div>

          <ChevronDown
            size={18}
            className="profile-arrow"
          />

          {/* POPUP */}

          <AnimatePresence>

            {
              showProfile && (

                <motion.div

                  className="profile-popup"

                  initial={{
                    opacity: 0,
                    y: 15
                  }}

                  animate={{
                    opacity: 1,
                    y: 0
                  }}

                  exit={{
                    opacity: 0,
                    y: 15
                  }}

                  transition={{
                    duration: 0.25
                  }}
                >

                  <div className="popup-top">

                    <div className="popup-avatar">

                      {
                        currentUserEmail?.[0]
                          ?.toUpperCase()
                      }

                    </div>

                    <div>

                      <h3>

                        {
                          currentUserEmail
                            ?.split("@")[0]
                        }

                      </h3>

                      <p>
                        {currentUserEmail}
                      </p>

                    </div>

                  </div>

                  <div className="popup-divider"></div>

                  {/* STATUS */}

                  <div className="popup-status">

                    <div className="online-dot"></div>

                    <span>
                      Active Now
                    </span>

                  </div>

                  {/* BUTTON */}

                  <button className="logout-btn">
                    Logout
                  </button>

                </motion.div>

              )
            }

          </AnimatePresence>

        </div>

      </div>

    </motion.div>

  );
}

export default Navbar;

