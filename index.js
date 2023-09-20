const model = {
  // 電影相關變數
  movies: [],  // 原始總電影陣列
  filteredMovies: [],  // 篩選後電影陣列  
  BASE_URL: 'https://webdev.alphacamp.io',   // API主機
  INDEX_URL: '',  // 查指定電影網址
  POSTER_URL: '', // 查指定電影圖片網址

  // 狀態相關變數
  isCardView: true,     // 是否卡片模式，預設為是
  keyword: '',          // 搜尋關鍵字
  currentPage: 1,      // 預設當前頁碼
  cardId: 0,           // 存放modal卡id
  MOVIES_PER_PAGE: 12,  //預設每頁放12個電影

  // DOM定位相關變數 
  dataPanel: document.querySelector('#data-panel'),     //render電影清單區
  searchForm: document.querySelector('#search-form'),   //搜尋區
  searchInput: document.querySelector('#search-input'), //表單輸入內容
  paginator: document.querySelector('#paginator'),      //頁碼區
  displayMode: document.querySelector('.display-mode'), //顯示模式切換區

  modalTitle: document.querySelector('#movie-modal-title'), //modal標題區
  modalImage: document.querySelector('#movie-modal-image'), //modal圖片區
  modalDate: document.querySelector('#movie-modal-date'),   //modal上映日期區
  modalDescription: document.querySelector('#movie-modal-description'), //modal描述區
  // 初始化 API URL
  initApiUrls() {
    this.INDEX_URL = this.BASE_URL + '/api/movies/';
    this.POSTER_URL = this.BASE_URL + '/posters/';
  }

};

// 數據變換控制區
const dataControl = {
  init() {
    this.getMovieCardFromAPI();
  },
  getMovieCardFromAPI() {
    axios
      .get(model.INDEX_URL)
      .then((response) => {
        model.movies.push(...response.data.results)
        view.renderPaginator(model.movies.length);
        view.renderMovieList(this.getMoviesByPage(1));
      })
      .catch((err) => console.log('API 請求失敗：', err));
  }, getMovieModalFromAPI(movieId) {

    axios.get(`${model.INDEX_URL + movieId}`).then((response) => {
      const data = response.data.results
      model.modalTitle.innerText = data.title
      model.modalImage.innerHTML = `<img src= "${model.POSTER_URL + data.image}"
    alt = "movie-poster" class="img-fluid" >`
      model.modalDate.innerText = "Release Date : " + data.release_date
      model.modalDescription.innerText = data.description
    })
  }, getMoviesByPage(page) {
    //如果filteredMovies長度不為0，則data=filteredMovies，否則回傳movies
    const data = model.filteredMovies.length ? model.filteredMovies : model.movies
    const startIndex = (page - 1) * model.MOVIES_PER_PAGE
    //修改這裡
    return data.slice(startIndex, startIndex + model.MOVIES_PER_PAGE)
  },
  addToFavorite(inputId) {
    const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
    const movie = model.movies.find((movie) => movie.id === inputId)
    if (list.some((movie) => movie.id === inputId)) {
      return alert('此電影已經在收藏清單中！')
    }
    list.push(movie)
    localStorage.setItem('favoriteMovies', JSON.stringify(list))
  }

}

// 介面控制區
const view = {
  renderPaginator(amount) {
    //計算總頁數
    const numberOfPages = Math.ceil(amount / model.MOVIES_PER_PAGE)
    //製作 template
    let rawHTML = ''

    for (let page = 1; page <= numberOfPages; page++) {
      rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
    }
    //放回 HTML
    model.paginator.innerHTML = rawHTML
  },
  generateCardHTML(item) {
    // Card模式要回傳的HTML內容
    return `
    <div class="col-sm-3">
      <div class="mb-2">
        <div class="card">
          <img src="${model.POSTER_URL + item.image}"
            class="card-img-top" alt="Movie Poster"/>
          <div class="card-body">
            <h5 class="card-title">${item.title}</h5>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
              data-bs-target="#movie-modal" data-id="${item.id}">More</button>
            <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
          </div>
        </div>
      </div>
    </div>`;
  },
  generateListHTML(item) {
    // List模式要回傳的HTML內容
    return `
    <div class="col-sm-12">
      <div class="mb-2">
        <div class="card card-list">
          <div class="card-body card-body-list col-sm-8">
            <h5 class="card-title">${item.title}</h5>
          </div>
          <div class="card-bottom card-bottom-list col-sm-4">
            <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
              data-bs-target="#movie-modal" data-id="${item.id}">More</button>
            <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
          </div>
        </div>
      </div>
    </div>`;
  },
  showContentByMode(isCardMode, data) {
    let rawHTML = ''
    data.forEach(item => {
      // 根據顯示狀態決定要回傳的rawHTML內容
      let tempHTML = (isCardMode) ? this.generateCardHTML(item) : this.generateListHTML(item)
      rawHTML += tempHTML
    })
    return rawHTML
  },

  renderMovieList(data) {
    model.dataPanel.innerHTML = view.showContentByMode(model.isCardView, data)
  }
  ,
  showMovieModal(movieId) {
    dataControl.getMovieModalFromAPI(movieId)
  }
}

// 事件監聽區
const listener = {
  int() {
    this.listenToDisplayMode()
    this.listenToCardPanel()
    this.listenToSearchForm()
    this.listenToPaginator()
  },
  listenToDisplayMode() {
    // 監聽顯示模式點擊
    model.displayMode.addEventListener('click', function onDisplayModeClicked(event) {
      model.isCardView = event.target.matches('.cards-view') ? true : false;
      let page = (model.filteredMovies.length > 12) ? model.currentPage : 1;
      view.renderMovieList(dataControl.getMoviesByPage(page))
    })
  }
  ,
  listenToCardPanel() {
    // 監聽卡片區點擊
    model.dataPanel.addEventListener('click', function onPanelClicked(event) {
      model.cardId = Number(event.target.dataset.id)
      if (event.target.matches('.btn-show-movie')) {
        view.showMovieModal(model.cardId)
      } else if (event.target.matches('.btn-add-favorite')) {
        dataControl.addToFavorite(model.cardId)
      }
    })
  },
  listenToSearchForm() {
    //監聽表單提交事件實現搜尋功能
    model.searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
      event.preventDefault()
      model.keyword = model.searchInput.value.trim().toLowerCase()
      model.filteredMovies = model.movies.filter((movie) =>
        movie.title.toLowerCase().includes(model.keyword)
      )
      if (model.filteredMovies.length === 0) {
        return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
      }
      //重製分頁器
      view.renderPaginator(model.filteredMovies.length)
      //預設顯示第 1 頁的搜尋結果
      view.renderMovieList(dataControl.getMoviesByPage(1))
    })
  },
  listenToPaginator() {
    // 監聽頁簽點擊
    model.paginator.addEventListener('click', function onPaginatorClicked(event) {
      //如果被點擊的不是 a 標籤，結束
      if (event.target.tagName !== 'A') return

      //透過 dataset 取得被點擊的頁數，並存到狀態區的當前頁面中
      model.currentPage = Number(event.target.dataset.page)
      //更新畫面
      view.renderMovieList(dataControl.getMoviesByPage(model.currentPage))
    })
  },
}


// 進站初始呼叫
model.initApiUrls()
dataControl.init()
listener.int()

