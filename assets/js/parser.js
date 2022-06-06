class TinyImgParser {
  constructor(tinyMceOutput) {
    // This is the TinyMCE Json output - which should be an array like the example.json structure
    this.output = tinyMceOutput;
  }

  async parseAndUpload() {
    try {
      this.toggleBackdrop();

      // 1. parse
      // Loop through the array and extract the `description.text` html then get the base64 src
      // The idea is to mark the img src with index, then replace it with the uploaded path
      let index = 0;
      const form = new FormData();
      for (const obj of this.output) {
        if (!obj.description || !obj.description?.text) continue;

        // create element to get img src(es)
        const div = document.createElement("div");
        div.innerHTML = obj.description.text;
        const images = div.querySelectorAll("img");
        if (!images.length) continue;

        // convert img elements to File obj
        for (const imgEl of images) {
          try {
            const imgFile = await this.convertImageElementtoFile(imgEl);
            if (imgFile) {
              // Mark this src with the index to replace it later
              imgEl.src = index;
              form.append("images", imgFile);
              index++;
            }
          } catch (error) {
            alert(
              "Error parsing images, something wrong with the <img src='?'> "
            );
          }
        }

        // Reassign the obj description with the new html string with indexed src
        obj.description.text = div.innerHTML;
      }

      // 3. Upload
      if (form.has("images")) {
        const res = await axios.post(
          "/survey/upload-images/userId/surveyId",
          form,
          {
            onUploadProgress: this.updateProgress,
          }
        );

        // Replace indexed src with image paths
        if (res.data.length > 0) {
          let setIndex = 0;
          for (const obj of this.output) {
            if (!obj.description || !obj.description?.text) continue;
            const div = document.createElement("div");
            div.innerHTML = obj.description?.text;
            const images = div.querySelectorAll("img");
            if (!images.length) continue;

            for (const imgEl of images) {
              imgEl.src = `/${res.data[setIndex]}`;
              setIndex++;
            }
            // Reassign the obj description with the new html string with real path src
            obj.description.text = div.innerHTML;
          }
        }

        // Set textarea new output
        TinyImgParser.resetTextareaExample(this.output);
      }
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "ERROR");
    } finally {
      this.toggleBackdrop(false);
    }
  }

  /**
   *
   * @param {HTMLImageElement} imgEl
   * Convert the image base64 src
   * into uploadable File object
   * @returns File | undefined
   */
  async convertImageElementtoFile(imgEl = {}) {
    const name = imgEl.alt || Date.now();
    if (!imgEl.src) return;
    const res = await fetch(imgEl.src);
    const blob = await res.blob();
    const ext = blob.type.split("/")[1];
    const nameWithExt = name + "." + ext;
    return new File([blob], nameWithExt, { type: blob.type });
  }

  /**
   *
   * @param {Axios progress Obj} progress
   *
   * Update progress of the upload
   *
   * This probably should be removed
   * Most likely you have your own progress bar UI
   * You can use this number to update your UI
   *
   * @returns void
   */
  updateProgress(progress) {
    const { total, loaded } = progress;
    const totalSizeInMB = total / 1000000;
    const loadedSizeInMB = loaded / 1000000;
    const uploadPercentage = (loadedSizeInMB / totalSizeInMB) * 100;

    // Update UI
    document.querySelector("progress").value = uploadPercentage;
    document
      .getElementById("dackdrop")
      .querySelector("h4").innerText = `${uploadPercentage.toFixed(0)}%`;
  }

  toggleBackdrop(on = true) {
    const bd = document.getElementById("dackdrop");
    if (on) {
      bd.style.display = "flex";
    } else {
      bd.style.display = "none";
    }
  }
  /**
   * This should be removed
   * There is a source of JSON array obj that I don't know
   * so this example is just for testing
   * @returns The TinyMCE JSON array
   */
  static async getExampleJson() {
    try {
      const res = await axios.get("/example.json");
      return res.data;
    } catch (error) {
      alert("Error loading json example");
    }
  }
  /**
   *
   * @param { Array } newJson
   * Take the TinyMce Array obj, or fallback to default one
   *
   * This should be removed
   * It's just for testing purposes - to set textarea value to example json
   * @returns void
   */
  static async resetTextareaExample(newJson = []) {
    try {
      document.getElementById("preview").innerHTML = "";

      let example = newJson;
      if (!newJson.length) {
        example = await this.getExampleJson();
      }
      document.querySelector("textarea").value = JSON.stringify(example);

      if (newJson.length > 0) {
        for (const obj of newJson) {
          document
            .getElementById("preview")
            .insertAdjacentHTML("beforeend", obj.description?.text);
        }
      }
    } catch (error) {
      alert("Error loading json example");
    }
  }
}
