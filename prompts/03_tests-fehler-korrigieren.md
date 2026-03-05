please correct these mistakes from the cypress tests

────────────────────────────────────────────────────────────────────────────────

  Running:  ArticleListView.cy.js                                                           (2 of 3)

  ArticleListView – Ausblenden & Löschen
    ✓ shows active articles (123ms)
    1) calls hideArticle when the hide button is clicked
    ✓ does not call deleteArticle when hide button is clicked (119ms)
    ✓ hidden articles section is not shown when hiddenArticles is empty (40ms)
    ✓ shows toggle button when hiddenArticles exist (45ms)
    ✓ hidden articles list is collapsed by default (45ms)
    ✓ expands hidden articles on toggle click (125ms)
    ✓ collapses hidden articles on second toggle click (189ms)
    2) calls restoreArticle when restore button is clicked
    3) calls deleteArticle when permanent delete button is clicked in hidden section
    ✓ shows the count of hidden articles in the toggle button (38ms)
  8 passing (14s)
  3 failing
  1) ArticleListView – Ausblenden & Löschen
       calls hideArticle when the hide button is clicked:
      Timed out retrying after 4000ms
      + expected - actual
      -[ undefined,
      +[ 'list-1',
         { _id: 'a1',
           type: 'article',
           listId: 'list-1',
           name: 'Milch',

  AssertionError: Timed out retrying after 4000ms: expected hideArticle to have been called with arguments "list-1", Object{9}

      The following calls were made:

      at <unknown> (    hideArticleundefined, Object{9} => Object{6} at Proxy.wrappedAction http://localhost:5173/__cypress/runner/cypress_runner.js:53380:26)
      at Context.<anonymous> (/home/runner/work/syt5-gek1051-mobile-application-cocojambo/syt5-gek1051-mobile-application-cocojambo/frontend/src/__tests__/ArticleListView.cy.js:68:38)

  2) ArticleListView – Ausblenden & Löschen
       calls restoreArticle when restore button is clicked:
      Timed out retrying after 4000ms
      + expected - actual
      -[ undefined,
      +[ 'list-1',
         { _id: 'a3',
           type: 'article',
           listId: 'list-1',
           name: 'Butter',

  AssertionError: Timed out retrying after 4000ms: expected restoreArticle to have been called with arguments "list-1", Object{9}

      The following calls were made:

      at <unknown> (    restoreArticleundefined, Object{9} => Object{6} at Proxy.wrappedAction http://localhost:5173/__cypress/runner/cypress_runner.js:53380:26)
      at Context.<anonymous> (/home/runner/work/syt5-gek1051-mobile-application-cocojambo/syt5-gek1051-mobile-application-cocojambo/frontend/src/__tests__/ArticleListView.cy.js:120:41)

  3) ArticleListView – Ausblenden & Löschen
       calls deleteArticle when permanent delete button is clicked in hidden section:
      Timed out retrying after 4000ms
      + expected - actual
      -[ undefined, 'a3', '1-a3' ]
      +[ 'list-1', 'a3', '1-a3' ]

  AssertionError: Timed out retrying after 4000ms: expected deleteArticle to have been called with arguments "list-1", "a3", "1-a3"

      The following calls were made:

      at <unknown> (    deleteArticleundefined, "a3", "1-a3" => Object{6} at Proxy.wrappedAction http://localhost:5173/__cypress/runner/cypress_runner.js:53380:26)
      at Context.<anonymous> (/home/runner/work/syt5-gek1051-mobile-application-cocojambo/syt5-gek1051-mobile-application-cocojambo/frontend/src/__tests__/ArticleListView.cy.js:128:40)
