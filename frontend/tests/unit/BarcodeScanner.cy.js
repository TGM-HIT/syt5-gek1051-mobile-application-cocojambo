import BarcodeScanner from '../../src/views/BarcodeScanner.vue'

const mockProductResponse = {
  status: 1,
  product: {
    product_name_de: 'Testprodukt',
    product_name: 'Test Product',
    nutriments: {
      'energy-kcal_100g': 250,
      'fat_100g': 10,
      'saturated-fat_100g': 4,
      'carbohydrates_100g': 30,
      'sugars_100g': 5,
      'fiber_100g': 2,
      'proteins_100g': 8,
      'salt_100g': 0.5,
    },
  },
}

const mockProductNoNutrition = {
  status: 1,
  product: {
    product_name_de: 'Produkt ohne Nährwerte',
    product_name: 'No Nutrition Product',
    nutriments: {},
  },
}

const mockProductNotFound = {
  status: 0,
}

// Helper: stub window.fetch and mount the component
function mountWithFetch(fetchResponse) {
  cy.window().then((win) => {
    cy.stub(win, 'fetch').as('fetchStub').resolves({
      json: () => Promise.resolve(fetchResponse),
    })
  })
  cy.mount(BarcodeScanner)
}

// Helper: type a barcode and submit the manual form
function submitManual(barcode) {
  cy.get('input[placeholder="Barcode manuell eingeben..."]').type(barcode)
  cy.contains('button', 'OK').click()
}

describe('BarcodeScanner – Kameraansicht', () => {
  beforeEach(() => {
    cy.mount(BarcodeScanner)
  })

  it('renders the camera video element', () => {
    cy.get('video').should('exist')
  })

  it('shows the manual barcode input field', () => {
    cy.get('input[placeholder="Barcode manuell eingeben..."]').should('be.visible')
  })

  it('shows the OK submit button', () => {
    cy.contains('button', 'OK').should('be.visible')
  })

  it('shows the Abbrechen button', () => {
    cy.contains('button', 'Abbrechen').should('be.visible')
  })

  it('OK button is disabled when input is empty', () => {
    cy.contains('button', 'OK').should('be.disabled')
  })

  it('OK button is enabled after typing a barcode', () => {
    cy.get('input[placeholder="Barcode manuell eingeben..."]').type('4000417025005')
    cy.contains('button', 'OK').should('not.be.disabled')
  })

  it('emits close when Abbrechen is clicked', () => {
    const onClose = cy.spy().as('closeSpy')
    cy.mount(BarcodeScanner, { props: { onClose } })
    cy.contains('button', 'Abbrechen').click()
    cy.get('@closeSpy').should('have.been.called')
  })
})

describe('BarcodeScanner – Manuelle Eingabe & API', () => {
  beforeEach(() => {
    mountWithFetch(mockProductResponse)
  })

  it('calls the OpenFoodFacts API with the entered barcode', () => {
    submitManual('4000417025005')
    cy.get('@fetchStub').should(
      'have.been.calledWithMatch',
      'https://world.openfoodfacts.org/api/v0/product/4000417025005.json',
    )
  })

  it('shows the nutrition popup after a successful lookup', () => {
    submitManual('4000417025005')
    cy.contains('Testprodukt').should('be.visible')
  })

  it('shows the product name in the popup header', () => {
    submitManual('4000417025005')
    cy.get('h2').should('contain', 'Testprodukt')
  })

  it('shows the "Nährwerte pro 100 g" section heading', () => {
    submitManual('4000417025005')
    cy.contains('Nährwerte pro 100 g').should('be.visible')
  })

  it('shows energy value in the popup', () => {
    submitManual('4000417025005')
    cy.contains('Energie').should('be.visible')
    cy.contains('250 kcal').should('be.visible')
  })

  it('shows fat value in the popup', () => {
    submitManual('4000417025005')
    cy.contains('Fett').should('be.visible')
    cy.contains('10 g').should('be.visible')
  })

  it('shows protein value in the popup', () => {
    submitManual('4000417025005')
    cy.contains('Eiweiß').should('be.visible')
    cy.contains('8 g').should('be.visible')
  })

  it('shows salt value in the popup', () => {
    submitManual('4000417025005')
    cy.contains('Salz').should('be.visible')
    cy.contains('0.5 g').should('be.visible')
  })

  it('shows the "Zur Liste hinzufügen" button in the popup', () => {
    submitManual('4000417025005')
    cy.contains('button', 'Zur Liste hinzufügen').should('be.visible')
  })

  it('shows the Abbrechen button in the popup', () => {
    submitManual('4000417025005')
    cy.contains('button', 'Abbrechen').should('be.visible')
  })

  it('emits scanned with the product name when "Zur Liste hinzufügen" is clicked', () => {
    const onScanned = cy.spy().as('scannedSpy')
    cy.mount(BarcodeScanner, { props: { onScanned } })
    submitManual('4000417025005')
    cy.contains('button', 'Zur Liste hinzufügen').click()
    cy.get('@scannedSpy').should('have.been.calledWith', 'Testprodukt')
  })

  it('emits close when Abbrechen is clicked in the popup', () => {
    const onClose = cy.spy().as('closeSpy')
    cy.mount(BarcodeScanner, { props: { onClose } })
    submitManual('4000417025005')
    cy.contains('button', 'Abbrechen').click()
    cy.get('@closeSpy').should('have.been.called')
  })
})

describe('BarcodeScanner – Produkt nicht gefunden', () => {
  it('shows the barcode as product name when the API returns status 0', () => {
    mountWithFetch(mockProductNotFound)
    submitManual('0000000000000')
    cy.get('h2').should('contain', '0000000000000')
  })

  it('shows "Keine Nährwertangaben verfügbar" when product is not found', () => {
    mountWithFetch(mockProductNotFound)
    submitManual('0000000000000')
    cy.contains('Keine Nährwertangaben verfügbar').should('be.visible')
  })

  it('shows "Keine Nährwertangaben verfügbar" when nutriments are all missing', () => {
    mountWithFetch(mockProductNoNutrition)
    submitManual('1234567890123')
    cy.contains('Keine Nährwertangaben verfügbar').should('be.visible')
  })

  it('still shows the product name when nutriments are missing', () => {
    mountWithFetch(mockProductNoNutrition)
    submitManual('1234567890123')
    cy.get('h2').should('contain', 'Produkt ohne Nährwerte')
  })
})

describe('BarcodeScanner – Netzwerkfehler', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      cy.stub(win, 'fetch').as('fetchStub').rejects(new Error('Network error'))
    })
    cy.mount(BarcodeScanner)
  })

  it('shows the barcode as product name when the API request fails', () => {
    submitManual('9999999999999')
    cy.get('h2').should('contain', '9999999999999')
  })

  it('shows "Keine Nährwertangaben verfügbar" after a network failure', () => {
    submitManual('9999999999999')
    cy.contains('Keine Nährwertangaben verfügbar').should('be.visible')
  })
})
