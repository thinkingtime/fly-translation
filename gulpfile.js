const fs = require("fs");
const process = require("process");

const gulp = require("gulp");
const zip = require("gulp-zip");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");

const crx3 = require("crx3");

const remoteSourceMaps =
  process.argv[2] === "--local-sourcemaps" ? false : true;
const version = JSON.parse(
  fs.readFileSync("src/manifest.json", "utf8")
).version;

const chromium_folder_name = `FT_${version}_Chromium`;
const firefox_folder_name = `FT_${version}_Firefox`;

const mappath = `../maps/${version}`;
const mapconfig = remoteSourceMaps
  ? {
      sourceMappingURLPrefix:
        "https://raw.githubusercontent.com/FilipePS/FT---Source-Maps/main",
    }
  : null;

const babelConfig = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          firefox: "64",
          chrome: "70",
        },
        // corejs: 3,
        // useBuiltIns: "usage",
      },
    ],
  ],
  plugins: [
    // ["@babel/plugin-transform-runtime"],
    // ["@babel/plugin-syntax-dynamic-import"],
  ],
};

gulp.task("clean", (cb) => {
  fs.rmSync("build", { recursive: true, force: true });
  cb();
});

gulp.task("firefox-copy", () => {
  return gulp
    .src(["src/**/**"])
    .pipe(gulp.dest(`build/${firefox_folder_name}`));
});

gulp.task("firefox-babel", () => {
  return Promise.all([
    new Promise((resolve, reject) => {
      gulp
        .src([`build/${firefox_folder_name}/background/*.js`])
        .pipe(sourcemaps.init())
        .pipe(babel(babelConfig))
        .pipe(sourcemaps.write(mappath, mapconfig))
        .on("error", reject)
        .pipe(gulp.dest(`build/${firefox_folder_name}/background`))
        .on("end", resolve);
    }),
    new Promise((resolve, reject) => {
      gulp
        .src([`build/${firefox_folder_name}/lib/*.js`])
        .pipe(sourcemaps.init())
        .pipe(babel(babelConfig))
        .pipe(sourcemaps.write(mappath, mapconfig))
        .on("error", reject)
        .pipe(gulp.dest(`build/${firefox_folder_name}/lib`))
        .on("end", resolve);
    }),
    new Promise((resolve, reject) => {
      gulp
        .src([`build/${firefox_folder_name}/contentScript/*.js`])
        .pipe(sourcemaps.init())
        .pipe(babel(babelConfig))
        .pipe(sourcemaps.write(mappath, mapconfig))
        .on("error", reject)
        .pipe(gulp.dest(`build/${firefox_folder_name}/contentScript`))
        .on("end", resolve);
    }),
    new Promise((resolve, reject) => {
      gulp
        .src([`build/${firefox_folder_name}/options/*.js`])
        .pipe(sourcemaps.init())
        .pipe(babel(babelConfig))
        .pipe(sourcemaps.write(mappath, mapconfig))
        .on("error", reject)
        .pipe(gulp.dest(`build/${firefox_folder_name}/options`))
        .on("end", resolve);
    }),
    new Promise((resolve, reject) => {
      gulp
        .src([`build/${firefox_folder_name}/popup/*.js`])
        .pipe(sourcemaps.init())
        .pipe(babel(babelConfig))
        .pipe(sourcemaps.write(mappath, mapconfig))
        .on("error", reject)
        .pipe(gulp.dest(`build/${firefox_folder_name}/popup`))
        .on("end", resolve);
    }),
  ]);
});

gulp.task("firefox-move-sourcemap", (cb) => {
  if (!remoteSourceMaps) {
    return cb();
  }
  return new Promise((resolve, reject) => {
    gulp
      .src([`build/${firefox_folder_name}/maps/**/*`])
      .pipe(gulp.dest("build/maps"))
      .on("error", reject)
      .on("end", resolve);
  }).then(() => {
    fs.rmSync(`build/${firefox_folder_name}/maps`, {
      recursive: true,
      force: true,
    });
  });
});

gulp.task("firefox-self-hosted", (cb) => {
  return new Promise((resolve, reject) => {
    gulp
      .src([`build/${firefox_folder_name}/**/**`])
      .pipe(gulp.dest(`build/${firefox_folder_name}_selfhosted`))
      .on("error", reject)
      .on("end", resolve);
  }).then(() => {
    const manifest = JSON.parse(
      fs.readFileSync(
        `build/${firefox_folder_name}_selfhosted/manifest.json`,
        "utf8"
      )
    );
    manifest.browser_specific_settings.gecko.update_url =
      "https://raw.githubusercontent.com/FilipePS/fly-translation/master/dist/firefox/updates.json";
    fs.writeFileSync(
      `build/${firefox_folder_name}_selfhosted/manifest.json`,
      JSON.stringify(manifest, null, 4),
      "utf8"
    );
  });
});

gulp.task("firefox-zip", () => {
  return gulp
    .src([`build/${firefox_folder_name}/**/*`])
    .pipe(zip(`FT_${version}_Firefox.zip`))
    .pipe(gulp.dest("build"));
});

gulp.task("chrome-copy-from-firefox", () => {
  return gulp
    .src([`build/${firefox_folder_name}/**/**`])
    .pipe(gulp.dest(`build/${chromium_folder_name}`));
});

gulp.task("chrome-rename", (cb) => {
  fs.renameSync(
    `build/${chromium_folder_name}/manifest.json`,
    `build/${chromium_folder_name}/firefox_manifest.json`
  );
  fs.renameSync(
    `build/${chromium_folder_name}/chrome_manifest.json`,
    `build/${chromium_folder_name}/manifest.json`
  );
  cb();
});

gulp.task("chrome-zip", () => {
  return gulp
    .src([`build/${chromium_folder_name}/**/**`])
    .pipe(zip(`${chromium_folder_name}.zip`))
    .pipe(gulp.dest("build"));
});

gulp.task("chrome-sign", (cb) => {
  const dialog = require("node-file-dialog");

  if (process.argv[2] === "--sign") {
    return dialog({ type: "open-file" }).then((file) => {
      return crx3([`build/${chromium_folder_name}/manifest.json`], {
        keyPath: file[0],
        crxPath: `build/${chromium_folder_name}.crx`,
      });
    });
  } else {
    cb();
  }
});

gulp.task(
  "firefox-build",
  gulp.series(
    "firefox-copy",
    "firefox-babel",
    "firefox-move-sourcemap",
    "firefox-self-hosted",
    "firefox-zip"
  )
);
gulp.task(
  "chrome-build",
  gulp.series(
    "chrome-copy-from-firefox",
    "chrome-rename",
    "chrome-zip",
    "chrome-sign"
  )
);

gulp.task("default", gulp.series("clean", "firefox-build", "chrome-build"));
