document.addEventListener('DOMContentLoaded', function() {
    // Game variables
    let balance = 500;
    let currentBet = 0;
    let deck = [];
    let playerHand = [];
    let dealerHand = [];
    let gameInProgress = false;
    
    // DOM elements
    const balanceDisplay = document.getElementById('balance');
    const currentBetDisplay = document.getElementById('current-bet');
    const dealerCardsDisplay = document.getElementById('dealer-cards');
    const playerCardsDisplay = document.getElementById('player-cards');
    const dealerScoreDisplay = document.getElementById('dealer-score');
    const playerScoreDisplay = document.getElementById('player-score');
    const messageDisplay = document.getElementById('message');
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const doubleBtn = document.getElementById('double-btn');
    const betButtons = document.querySelectorAll('.bet-btn');
    
    // Initialize game
    updateDisplay();
    
    // Event listeners
    dealBtn.addEventListener('click', deal);
    hitBtn.addEventListener('click', hit);
    standBtn.addEventListener('click', stand);
    doubleBtn.addEventListener('click', double);
    
    betButtons.forEach(button => {
        button.addEventListener('click', function() {
            const betAmount = parseInt(this.textContent.replace('$', ''));
            placeBet(betAmount);
        });
    });
    
    // Game functions
    function placeBet(amount) {
        if (gameInProgress) return;
        
        if (balance >= amount) {
            currentBet += amount;
            balance -= amount;
            updateDisplay();
        } else {
            showMessage("You don't have enough money!");
        }
    }
    
    function deal() {
        if (currentBet === 0) {
            showMessage("Please place a bet first!");
            return;
        }
        
        if (gameInProgress) {
            // Start a new game
            resetGame();
        }
        
        gameInProgress = true;
        deck = createDeck();
        shuffleDeck(deck);
        
        // Deal initial cards
        playerHand = [drawCard(), drawCard()];
        dealerHand = [drawCard(), drawCard()];
        
        // Update UI
        updateHandDisplay();
        updateScores();
        updateButtons();
        
        // Check for blackjack
        if (calculateScore(playerHand) === 21) {
            endGame("Blackjack! You win!", 2.5);
        } else {
            showMessage("Hit or Stand?");
        }
    }
    
    function hit() {
        if (!gameInProgress) return;
        
        playerHand.push(drawCard());
        updateHandDisplay();
        updateScores();
        
        const playerScore = calculateScore(playerHand);
        
        if (playerScore > 21) {
            endGame("Bust! You lose.");
        } else if (playerScore === 21) {
            stand(); // Automatically stand on 21
        } else {
            showMessage("Hit or Stand?");
        }
    }
    
    function stand() {
        if (!gameInProgress) return;
        
        // Reveal dealer's hidden card
        dealerHand[0].hidden = false;
        updateHandDisplay();
        
        // Dealer draws until score >= 17
        while (calculateScore(dealerHand) < 17) {
            dealerHand.push(drawCard());
            updateHandDisplay();
        }
        
        updateScores();
        determineWinner();
    }
    
    function double() {
        if (!gameInProgress || playerHand.length !== 2) return;
        
        if (balance >= currentBet) {
            balance -= currentBet;
            currentBet *= 2;
            
            playerHand.push(drawCard());
            updateHandDisplay();
            updateScores();
            updateDisplay();
            
            const playerScore = calculateScore(playerHand);
            
            if (playerScore > 21) {
                endGame("Bust! You lose.");
            } else {
                stand();
            }
        } else {
            showMessage("Not enough money to double!");
        }
    }
    
    function determineWinner() {
        const playerScore = calculateScore(playerHand);
        const dealerScore = calculateScore(dealerHand);
        
        if (dealerScore > 21) {
            endGame("Dealer busts! You win!", 2);
        } else if (playerScore > dealerScore) {
            endGame("You win!", 2);
        } else if (playerScore < dealerScore) {
            endGame("You lose.");
        } else {
            endGame("Push! It's a tie.", 1);
        }
    }
    
    function endGame(message, payoutMultiplier = 0) {
        gameInProgress = false;
        
        if (payoutMultiplier > 0) {
            const winnings = Math.floor(currentBet * payoutMultiplier);
            balance += winnings;
            showMessage(`${message} You win $${winnings}!`);
        } else {
            showMessage(message);
        }
        
        currentBet = 0;
        updateButtons();
        updateDisplay();
    }
    
    function resetGame() {
        playerHand = [];
        dealerHand = [];
        currentBet = 0;
        gameInProgress = false;
        clearMessage();
        updateHandDisplay();
        updateScores();
        updateButtons();
        updateDisplay();
    }
    
    // Helper functions
    function createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];
        
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        
        return deck;
    }
    
    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    function drawCard() {
        if (deck.length === 0) {
            deck = createDeck();
            shuffleDeck(deck);
        }
        
        const card = deck.pop();
        card.hidden = false;
        return card;
    }
    
    function calculateScore(hand) {
        let score = 0;
        let aces = 0;
        
        for (let card of hand) {
            if (card.hidden) continue;
            
            if (card.value === 'A') {
                aces++;
                score += 11;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        
        return score;
    }
    
    // Display functions
    function updateDisplay() {
        balanceDisplay.textContent = `$${balance}`;
        currentBetDisplay.textContent = currentBet;
    }
    
    function updateHandDisplay() {
        // Clear current displays
        dealerCardsDisplay.innerHTML = '';
        playerCardsDisplay.innerHTML = '';
        
        // Display dealer's cards (first card hidden)
        dealerHand.forEach((card, index) => {
            const cardElement = createCardElement(card, index === 0 && gameInProgress);
            dealerCardsDisplay.appendChild(cardElement);
        });
        
        // Display player's cards
        playerHand.forEach(card => {
            const cardElement = createCardElement(card, false);
            playerCardsDisplay.appendChild(cardElement);
        });
    }
    
    function createCardElement(card, isHidden) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        if (isHidden) {
            cardElement.classList.add('card-back');
            cardElement.textContent = '';
        } else {
            // Use Unicode suit symbols
            let suitSymbol;
            switch(card.suit) {
                case 'hearts': suitSymbol = '♥'; break;
                case 'diamonds': suitSymbol = '♦'; break;
                case 'clubs': suitSymbol = '♣'; break;
                case 'spades': suitSymbol = '♠'; break;
            }
            
            if (card.suit === 'hearts' || card.suit === 'diamonds') {
                cardElement.classList.add('red');
            }
            
            cardElement.innerHTML = `
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${suitSymbol}</div>
            `;
        }
        
        return cardElement;
    }
    
    function updateScores() {
        if (gameInProgress) {
            // Only show dealer's first card score if hidden
            const dealerScore = dealerHand[0].hidden ? 
                calculateScore([dealerHand[1]]) : 
                calculateScore(dealerHand);
            
            dealerScoreDisplay.textContent = dealerHand[0].hidden ? 
                `Score: ${dealerScore} + ?` : 
                `Score: ${dealerScore}`;
        } else {
            dealerScoreDisplay.textContent = `Score: ${calculateScore(dealerHand)}`;
        }
        
        playerScoreDisplay.textContent = `Score: ${calculateScore(playerHand)}`;
    }
    
    function updateButtons() {
        dealBtn.textContent = gameInProgress ? 'New Game' : 'Deal';
        hitBtn.disabled = !gameInProgress;
        standBtn.disabled = !gameInProgress;
        
        // Double only allowed on first move and with enough balance
        doubleBtn.disabled = !gameInProgress || 
                             playerHand.length !== 2 || 
                             balance < currentBet;
    }
    
    function showMessage(msg) {
        messageDisplay.textContent = msg;
    }
    
    function clearMessage() {
        messageDisplay.textContent = '';
    }
});