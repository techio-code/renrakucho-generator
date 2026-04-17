/* ===================================================
   保育士向けAI連絡帳ジェネレーター
   APIキー不要・テンプレートエンジン方式
   =================================================== */

'use strict';

// ===== 状態管理 =====
const state = {
  selectedAge: null,
  selectedTone: 'warm'
};

// ===== DOM取得 =====
const childNameInput = document.getElementById('childName');
const episodeInput = document.getElementById('episode');
const episodeCount = document.getElementById('episodeCount');
const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');

// ===== 文章テンプレートデータ =====

// 様子ラベル
const CONDITION_LABELS = {
  genki: '元気いっぱいに過ごしていました',
  egao: '笑顔あふれる一日でした',
  naita: '少し寂しそうな様子も見られましたが、気持ちを立て直して過ごしていました',
  yoku_tabeta: 'お食事もモリモリと食べていました',
  shoshoku: '今日はお食事が少なめでした',
  hirune_shita: 'お昼寝もよく眠れていました',
  hirune_shinakatta: '今日はお昼寝なしで元気に過ごしていました',
  tomodachi: 'お友達とも仲良く遊べていました'
};

// 年齢別フレーズ
const AGE_PHRASES = {
  0: {
    prefix: ['今日も', 'きょうも', '本日も'],
    growth: ['少しずつ', 'だんだんと', 'じわじわと'],
    action: ['じっと見つめる', '手を伸ばす', 'ニコニコと笑う', '声を出して喜ぶ'],
    suffix: ['これからの成長がとても楽しみです', '小さな変化がとても嬉しく感じられます', '一つひとつの表情が愛らしいです']
  },
  1: {
    prefix: ['今日は', 'きょうは', '本日は'],
    growth: ['どんどん', 'すくすくと', 'たくましく'],
    action: ['とことこ歩いて', 'よちよちと', '手をつないで', '興味津々で'],
    suffix: ['日々の成長に目が離せません', '元気いっぱいで毎日とても頼もしいです', '一日一日の成長が嬉しいです']
  },
  2: {
    prefix: ['今日は', 'きょうは', '本日は'],
    growth: ['ぐんぐんと', 'どんどん', 'のびのびと'],
    action: ['嬉しそうに', '夢中になって', '楽しそうに', '一生懸命に'],
    suffix: ['自分でできることが増えてきていますね', '日々の頑張りが伝わってきます', '子どもらしい笑顔に毎日元気をもらっています']
  },
  3: {
    prefix: ['今日は', 'きょうは', '本日は'],
    growth: ['どんどん', 'ぐんぐんと', 'たくましく'],
    action: ['上手に', '張り切って', '意欲的に', '楽しそうに'],
    suffix: ['友達との関わりも豊かになってきています', '自己表現がとても上手になってきました', '毎日のびのびと成長しています']
  },
  4: {
    prefix: ['今日は', 'きょうは', '本日は'],
    growth: ['ぐんぐんと', 'しっかりと', 'たくましく'],
    action: ['積極的に', '楽しそうに', '上手に', '一生懸命'],
    suffix: ['友達と助け合う姿も増えてきました', '様々なことへの好奇心が旺盛です', '毎日の関わりの中で多くのことを吸収しています']
  },
  5: {
    prefix: ['今日は', 'きょうは', '本日は'],
    growth: ['しっかりと', 'ぐんぐんと', 'たくましく'],
    action: ['積極的に', '率先して', '楽しそうに', '意欲的に'],
    suffix: ['リーダーシップを発揮する場面も増えてきました', '年長児として頼もしい姿を見せてくれています', '小学校進学に向けて着実に成長しています']
  },
  6: {
    prefix: ['今日は', 'きょうは', '本日は'],
    growth: ['しっかりと', 'たくましく', '立派に'],
    action: ['積極的に', '率先して', '丁寧に', '力強く'],
    suffix: ['もうすぐ小学校ですね。毎日の頑張りに感心しています', 'とても頼もしい姿に毎日感動しています', '卒園まで残り少ない日々を大切に過ごしていきましょう']
  }
};

// トーン修飾語
const TONE_MODIFIERS = {
  warm: {
    opening: ['今日もかわいい笑顔を見せてくれました', '今日も一日元気に過ごすことができました', '今日もにぎやかに過ごしていました'],
    middle: ['温かい雰囲気の中で', '友達と一緒に', 'みんなと仲良く'],
    closing: ['また明日も元気な笑顔を待っています♪', 'ご家庭でも今日の様子を聞いてあげてください', '明日も元気に来てくださいね']
  },
  polite: {
    opening: ['本日もお越しいただきありがとうございます', '本日の園での様子をお伝えします', '本日もお健やかにお過ごしでした'],
    middle: ['落ち着いた様子で', 'しっかりと取り組み', '丁寧に'],
    closing: ['引き続き見守ってまいります', '何かご不明な点がありましたらお気軽にお声がけください', 'どうぞよろしくお願いいたします']
  },
  bright: {
    opening: ['今日もキラキラ輝く一日でした！', '今日も元気もりもりでした！', '今日も笑顔がいっぱいの一日でした！'],
    middle: ['元気よく', 'いきいきと', '全力で'],
    closing: ['明日も一緒に楽しいことをしましょうね！', 'またあしたもたくさん遊ぼうね！', '明日もパワフルな姿を見せてくれそうです！']
  }
};

// ===== ユーティリティ関数 =====

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function countChars(str) {
  return str.length;
}

// 様子チェックボックスの選択値を取得
function getCheckedConditions() {
  const checked = document.querySelectorAll('.check-input:checked');
  return Array.from(checked).map(el => el.value);
}

// 様子フレーズを文に変換
function buildConditionSentence(conditions) {
  if (conditions.length === 0) return '';
  if (conditions.length === 1) {
    return CONDITION_LABELS[conditions[0]] + '。';
  }
  const labels = conditions.map(c => CONDITION_LABELS[c]);
  return labels.join('、') + '。';
}

// ===== 文章生成ロジック =====

function generateText(childName, age, episode, conditions, tone, variant) {
  const agePhrases = AGE_PHRASES[age] || AGE_PHRASES[3];
  const toneModifiers = TONE_MODIFIERS[tone];
  const conditionSentence = buildConditionSentence(conditions);

  let text = '';

  if (variant === 0) {
    // パターン1: エピソード先行型
    const episodeTrimmed = episode.trim();
    const growth = randomPick(agePhrases.growth);
    const closing = randomPick(toneModifiers.closing);

    text = `${childName}は今日、${episodeTrimmed}`;
    if (!text.endsWith('。') && !text.endsWith('！') && !text.endsWith('♪')) {
      text += '。';
    }
    if (conditionSentence) {
      text += conditionSentence;
    }
    text += `${growth}成長している姿にこちらも嬉しくなりました。${closing}`;

  } else if (variant === 1) {
    // パターン2: 様子先行型
    const prefix = randomPick(agePhrases.prefix);
    const action = randomPick(agePhrases.action);
    const suffix = randomPick(agePhrases.suffix);
    const episodeTrimmed = episode.trim();

    if (conditionSentence) {
      text = `${prefix}${childName}は${conditionSentence}`;
    } else {
      text = `${prefix}${childName}は${action}過ごしていました。`;
    }
    text += `${episodeTrimmed}`;
    if (!text.endsWith('。') && !text.endsWith('！') && !text.endsWith('♪')) {
      text += '。';
    }
    text += suffix + '。';

  } else {
    // パターン3: 保護者向け共有型
    const opening = randomPick(toneModifiers.opening);
    const middle = randomPick(toneModifiers.middle);
    const closing = randomPick(toneModifiers.closing);
    const episodeTrimmed = episode.trim();

    text = `${opening}。${middle}${episodeTrimmed}`;
    if (!text.endsWith('。') && !text.endsWith('！') && !text.endsWith('♪')) {
      text += '。';
    }
    if (conditionSentence) {
      text += conditionSentence;
    }
    text += closing;
  }

  return text;
}

// ===== バリデーション =====

function validateForm() {
  const name = childNameInput.value.trim();
  const episode = episodeInput.value.trim();
  const ageSelected = state.selectedAge !== null;

  const isValid = name.length > 0 && episode.length > 0 && ageSelected;
  generateBtn.disabled = !isValid;
  return isValid;
}

// ===== 結果カード描画 =====

const PATTERN_LABELS = [
  { label: 'パターン 1', icon: '🌸' },
  { label: 'パターン 2', icon: '🌼' },
  { label: 'パターン 3', icon: '🌊' }
];

function renderResults(texts) {
  resultsGrid.innerHTML = '';
  texts.forEach((text, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-card-header">
        <span class="result-pattern-label">${PATTERN_LABELS[i].icon} ${PATTERN_LABELS[i].label}</span>
        <span class="result-char-count">${countChars(text)}文字</span>
      </div>
      <div class="result-text" id="result-text-${i}">${escapeHtml(text)}</div>
      <button class="btn-copy" data-index="${i}">
        📋 コピーする
      </button>
    `;
    resultsGrid.appendChild(card);
  });

  // コピーボタンのイベント設定
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', handleCopy);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== コピー処理 =====

function handleCopy(e) {
  const idx = e.currentTarget.dataset.index;
  const textEl = document.getElementById(`result-text-${idx}`);
  const text = textEl.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopied(e.currentTarget);
    }).catch(() => {
      fallbackCopy(text, e.currentTarget);
    });
  } else {
    fallbackCopy(text, e.currentTarget);
  }
}

function fallbackCopy(text, btn) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showCopied(btn);
  } catch (e) {
    alert('コピーに失敗しました。手動でコピーしてください。');
  }
  document.body.removeChild(textarea);
}

function showCopied(btn) {
  const original = btn.innerHTML;
  btn.innerHTML = '✅ コピーしました！';
  btn.classList.add('copied');
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove('copied');
    btn.disabled = false;
  }, 2000);
}

// ===== 生成処理 =====

function doGenerate() {
  if (!validateForm()) return;

  const childName = childNameInput.value.trim();
  const age = state.selectedAge;
  const episode = episodeInput.value.trim();
  const conditions = getCheckedConditions();
  const tone = state.selectedTone;

  // ローディング表示
  resultsSection.classList.remove('hidden');
  resultsSection.querySelector('.results-header').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  resultsGrid.innerHTML = `
    <div class="generating">
      <div class="spinner"></div>
      <p class="generating-text">連絡帳を生成中...</p>
    </div>
  `;

  // 非同期で生成（UIフリーズ回避）
  setTimeout(() => {
    const texts = [
      generateText(childName, age, episode, conditions, tone, 0),
      generateText(childName, age, episode, conditions, tone, 1),
      generateText(childName, age, episode, conditions, tone, 2)
    ];
    renderResults(texts);
  }, 600);
}

// ===== イベントリスナー =====

// 年齢ボタン
document.querySelectorAll('.age-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedAge = parseInt(btn.dataset.age, 10);
    validateForm();
  });
});

// トーンボタン
document.querySelectorAll('.tone-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedTone = btn.dataset.tone;
  });
});

// 入力イベント
childNameInput.addEventListener('input', validateForm);
episodeInput.addEventListener('input', () => {
  episodeCount.textContent = episodeInput.value.length;
  validateForm();
});

// チェックボックス（バリデーションには影響しない）
document.querySelectorAll('.check-input').forEach(chk => {
  chk.addEventListener('change', () => {});
});

// 生成ボタン
generateBtn.addEventListener('click', doGenerate);

// 再生成ボタン
regenerateBtn.addEventListener('click', doGenerate);

// Enterキーで生成（テキストエリア以外）
childNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!generateBtn.disabled) doGenerate();
  }
});

// ===== 初期化 =====
validateForm();
