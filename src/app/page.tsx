'use client';

import { useState, useEffect } from "react";
import { createThirdwebClient, getContract, prepareContractCall } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { claimTo, getOwnedNFTs, getNFTs } from "thirdweb/extensions/erc1155";
import { ConnectButton, TransactionButton, useActiveAccount, useReadContract, MediaRenderer, useSendTransaction } from "thirdweb/react";
import { getUserUnlocks, saveUserUnlock } from "./actions";

// ==========================================
// ⚠️ 核心配置区
// ==========================================

const client = createThirdwebClient({
  clientId: "5f62d7285afa828b8e3a4efb68283144", 
});

const tgyContract = getContract({
  client,
  chain: defineChain(137), // Polygon Mainnet
  address: "0x424EDC04430186EfD49969a6D4E5ce5Ed684d16c", // 你的主网合约地址
});

// --- 盲盒奖池等级配置 ---
const TIER_1_POOLS = [0, 1, 2, 3]; 
const TIER_2_POOLS = [4, 5, 6]; 
const TIER_3_POOLS = [7, 8, 9]; 

// 🌟 精准库存配置映射表
const getMaxSupplyForId = (id: number) => {
  if (id >= 0 && id <= 3) return 2500; // Tier 1 每款 2500个
  if (id >= 4 && id <= 6) return 1888; // Tier 2 每款 1888个
  if (id >= 7 && id <= 9) return 999;  // Tier 3 每款 999个
  return 0;
};

// --- 画廊展示与 RWA 兑换元数据 ---
export const NFT_GALLERY_DATA = [
  { id: 0, tier: 1, name: "English Gentleman", country: "Great Britain", rwaReward: "顶级安溪铁观音 + 专属卡牌" },
  { id: 1, tier: 1, name: "American Street Style", country: "USA", rwaReward: "顶级安溪铁观音 + 专属卡牌" },
  { id: 2, tier: 1, name: "Roman Festivity", country: "Italy", rwaReward: "顶级安溪铁观音 + 专属卡牌" },
  { id: 3, tier: 1, name: "Romantic Artist", country: "France", rwaReward: "顶级安溪铁观音 + 专属卡牌" },
  { id: 4, tier: 2, name: "Pharaonic Majesty", country: "Egypt", rwaReward: "Tier 2 高端实体茶礼 + 典藏卡牌" },
  { id: 5, tier: 2, name: "Desert Mariachi", country: "Mexico", rwaReward: "Tier 2 高端实体茶礼 + 典藏卡牌" },
  { id: 6, tier: 2, name: "Sakura Samurai", country: "Japan", rwaReward: "Tier 2 高端实体茶礼 + 典藏卡牌" },
  { id: 7, tier: 3, name: "Aurora Viking", country: "Scandinavia", rwaReward: "Tier 3 宗师级茶礼 + 殿堂卡牌" },
  { id: 8, tier: 3, name: "Carnival Samba", country: "Brazil", rwaReward: "Tier 3 宗师级茶礼 + 殿堂卡牌" },
  { id: 9, tier: 3, name: "Oriental Empress", country: "China", rwaReward: "Tier 3 宗师级茶礼 + 殿堂卡牌" }
];

const translations = {
  zh: {
    subtitle: "安溪铁观音 RWA 数字化与销毁兑换生态",
    inboxBtn: "📬 核销凭证",
    inboxTitle: "📬 您的兑换凭证库",
    inboxNotice: "⚠️ 请注意：核销记录保存在本地。销毁成功后，请务必立刻点击下方按钮填写收货表单。",
    inboxEmpty: "暂无核销记录，请先在下方销毁您的 NFT 以兑换实物。",
    voucher: "兑换券",
    redemptionCode: "核销码",
    noImage: "无图",
    twitterClaim: "👉 关注官方 X (推特)",
    fillShipping: "🚚 填写收货地址 (必填)",
    shippingNotice: "⚠️ 请务必复制上方 TxHash 填入表单以作核对",
    storeTitle: "Store / TGY Mystery Boxes",
    storeDesc: "开启阶梯盲盒，探索不同稀有度的数字茶饼与实体权益",
    lockMsgTier2: "需拥有或曾获得「核心体验盲盒」",
    lockMsgTier3: "需拥有或曾获得「高级品鉴盲盒」",
    mintBtn: "铸造", 
    mintingBtn: "铸造中...",
    lockedBtn: "未解锁",
    redeemTitle: "物理实体兑换",
    redeemDesc: "执行不可逆销毁，触发全球跨境物流",
    holdingTitle: "✨ 您的数字藏品展厅：",
    refreshBtn: "刷新展厅",
    scanning: "正在连接区块链扫描展厅...",
    noNfts: "⚠️ 展厅空空如也，请先在上方抽取盲盒。",
    idLabel: "Token ID",
    qtyLabel: "持有数量",
    burnBtn: "销毁兑换",
    burningBtn: "处理中...",
    emptyBurnBtn: "库存不足",
    clickToPreview: "🔍 点击预览奖池",
    previewTitle: "奖池预览",
    previewDesc: "您有概率从此盲盒中抽取以下稀有度数字茶饼：",
    probabilityNote: "概率说明: 奖池内各道具抽取概率均等。执行链上随机算法。",
    mintTitle: "开箱成功",
    mintSub: "数字资产已批量存入您的展厅",
    burnSuccessTitle: "RWA 物理兑换已激活",
    burnSuccessSub: "实体物流程序已触发",
    qty: "数量",
    stock: "剩余盲盒",
    max: "最大",
    burnQuotes: [
      "当此代币归于虚无，其精髓便在您手中觉醒。感谢您将这杯来自区块链的茶带入现实中。",
      "数据在奇点中坍缩，茶香跨越维度重塑。现实的甘甜，是对数字信仰最纯粹的回馈。",
      "从一行不朽的加密代码，到一缕真实的百年茶香。我们销毁了数字的永恒，只为成全您舌尖的刹那。",
      "引力撕裂了像素，却把漫山遍野的春风送到了您面前。愿这杯跨越虚实的茶，温暖您的真实世界。",
      "虚拟资产隐入深空黑洞，大地的馈赠如约而至。干杯，致敬这杯连接 Web3 与物理世界的魔法。"
    ],
    essenceText: `"代币归于虚无，茶香在现实觉醒。"`
  },
  en: {
    subtitle: "Anxi Tieguanyin RWA Digitization & Burn-to-Redeem Ecosystem",
    inboxBtn: "📬 Receipts",
    inboxTitle: "📬 Your Redemption Receipts Vault",
    inboxNotice: "⚠️ NOTE: Receipts are stored locally. After burning, please fill out the shipping form immediately.",
    inboxEmpty: "No redemption records yet. Please burn an NFT below first.",
    voucher: "Voucher",
    redemptionCode: "Code",
    noImage: "No Image",
    twitterClaim: "👉 Follow us on X",
    fillShipping: "🚚 Fill Shipping Info",
    shippingNotice: "⚠️ Please copy the TxHash above into the form for verification",
    storeTitle: "Store / TGY Mystery Boxes",
    storeDesc: "Open tiered mystery boxes to discover tea vouchers of varying rarities.",
    lockMsgTier2: "Requires Genesis Box history",
    lockMsgTier3: "Requires Connoisseur Box history",
    mintBtn: "Mint", 
    mintingBtn: "Minting...",
    lockedBtn: "Locked",
    redeemTitle: "Physical Redemption",
    redeemDesc: "Perform irreversible burn to trigger global logistics",
    holdingTitle: "✨ Your Digital Gallery:",
    refreshBtn: "Refresh",
    scanning: "Connecting to blockchain...",
    noNfts: "⚠️ Your gallery is empty. Please draw a box above first.",
    idLabel: "Token ID",
    qtyLabel: "Owned",
    burnBtn: "Burn & Redeem",
    burningBtn: "Processing...",
    emptyBurnBtn: "No Balance",
    clickToPreview: "🔍 Preview Prize Pool",
    previewTitle: "Prize Pool",
    previewDesc: "You have a chance to draw the following digital tea vouchers:",
    probabilityNote: "Probability Note: Equal drop rate for all items. Executed via on-chain randomizer.",
    mintTitle: "MINT SUCCESSFUL",
    mintSub: "Items added to your gallery",
    burnSuccessTitle: "RWA REDEEMED",
    burnSuccessSub: "Physical logistics triggered",
    qty: "QTY",
    stock: "Remaining",
    max: "MAX",
    burnQuotes: [
      "As this token returns to the void, its essence awakens in your hands. Thank you for bringing this tea from the blockchain into reality.",
      "Data collapses in the singularity, while the aroma crosses dimensions. Physical sweetness is the purest reward for your digital faith.",
      "From an immortal line of code to a real wisp of ancient tea aroma. We burned digital eternity to fulfill a moment on your palate."
    ],
    essenceText: `"Token to the void, essence to reality."`
  }
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [rpcTimeout, setRpcTimeout] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
    const timer = setTimeout(() => { setRpcTimeout(true); }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const account = useActiveAccount(); 
  const [lang, setLang] = useState<"zh" | "en">("zh"); 
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewBoxId, setPreviewBoxId] = useState<string | null>(null); 
  
  const [unlockedState, setUnlockedState] = useState({ tier2: false, tier3: false });
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});
  const [isBatchMinting, setIsBatchMinting] = useState<Record<string, boolean>>({});

  const [burnAnim, setBurnAnim] = useState<{ active: boolean, imageUrl: string, quote: string } | null>(null);
  const [mintAnim, setMintAnim] = useState<{ active: boolean, boxName: string, tierClass: string, colorHex: string, results: any[] } | null>(null);

  const t = translations[lang]; 
  const { mutateAsync: sendTx } = useSendTransaction();

  const { data: ownedNfts, isLoading: isOwnedLoading, refetch: refetchOwned } = useReadContract(getOwnedNFTs, {
    contract: tgyContract,
    address: account?.address || "", 
    queryOptions: { enabled: !!account && isMounted },
  });

  const { data: allNfts, isLoading: isAllNftsLoading } = useReadContract(getNFTs, {
    contract: tgyContract,
  });

  const mysteryBoxes = [
    {
      id: "tier1", 
      name: lang === "zh" ? "🍵 核心体验盲盒 (Tier 1)" : "🍵 Genesis Box (Tier 1)",
      desc: lang === "zh" ? "无门槛体验 Web3 茶文化。随机开出 Token 0, 1, 2, 3。" : "No threshold. Randomly drops Token 0, 1, 2, 3.",
      price: "48.88 USDC", 
      targetIds: TIER_1_POOLS, 
      themeColor: "text-emerald-400",
      themeHex: "rgba(16,185,129," 
    },
    {
      id: "tier2", 
      name: lang === "zh" ? "🌿 高级品鉴盲盒 (Tier 2)" : "🌿 Connoisseur Box (Tier 2)",
      desc: lang === "zh" ? "更高等级的实体茶饼。随机开出 Token 4, 5, 6。" : "Higher-tier physical tea. Randomly drops Token 4, 5, 6.",
      price: "288.88 USDC",
      targetIds: TIER_2_POOLS, 
      themeColor: "text-purple-400",
      themeHex: "rgba(168,85,247," 
    },
    {
      id: "tier3", 
      name: lang === "zh" ? "👑 顶级茶王盲盒 (Tier 3)" : "👑 Core Node Box (Tier 3)",
      desc: lang === "zh" ? "顶级藏家专属，稀有茶王。随机开出 Token 7, 8, 9。" : "Top collectors exclusive. Randomly drops Token 7, 8, 9.",
      price: "888.88 USDC", 
      targetIds: TIER_3_POOLS, 
      themeColor: "text-amber-400",
      themeHex: "rgba(245,158,11," 
    }
  ];

  const activePreviewBox = mysteryBoxes.find(b => b.id === previewBoxId);

  useEffect(() => {
    async function fetchUnlocks() {
      if (account?.address && isMounted) {
        try {
          const unlocks = await getUserUnlocks(account.address);
          setUnlockedState(unlocks);
        } catch (error) {}
      }
    }
    fetchUnlocks();
  }, [account?.address, isMounted]);

  useEffect(() => {
    async function syncUnlocks() {
      if (account?.address && ownedNfts) {
        const hasTier1 = ownedNfts.some(nft => TIER_1_POOLS.includes(Number(nft.id)) && nft.quantityOwned > BigInt(0));
        const hasTier2 = ownedNfts.some(nft => TIER_2_POOLS.includes(Number(nft.id)) && nft.quantityOwned > BigInt(0));

        const newTier2 = unlockedState.tier2 || hasTier1;
        const newTier3 = unlockedState.tier3 || hasTier2;

        if (newTier2 !== unlockedState.tier2 || newTier3 !== unlockedState.tier3) {
          const newState = { tier2: newTier2, tier3: newTier3 };
          setUnlockedState(newState); 
          saveUserUnlock(account.address, newState).catch(() => {}); 
        }
      }
    }
    syncUnlocks();
  }, [ownedNfts, account?.address, unlockedState]);

  const hasFetchedNfts = !!(allNfts && Array.isArray(allNfts) && allNfts.length > 0);
  const isCurrentlyLoadingNfts = isAllNftsLoading && !rpcTimeout && !hasFetchedNfts;

  // 🌟 全新修复：精准计算真实发售库存
  const getInventory = (targetIds: number[]) => {
    // 动态计算该盲盒的总发行量
    let maxBoxSupply = 0;
    targetIds.forEach(id => {
       maxBoxSupply += getMaxSupplyForId(id);
    });
    
    if (!hasFetchedNfts) {
        return { max: maxBoxSupply, remaining: maxBoxSupply };
    }
    
    let totalMinted = 0;
    targetIds.forEach(id => {
      const nft = (allNfts as any[]).find(n => Number(n.id) === id);
      if (nft && nft.supply) {
        totalMinted += Number(nft.supply);
      }
    });

    let remaining = maxBoxSupply - totalMinted;
    if (remaining < 0) remaining = 0;
    
    return { max: maxBoxSupply, remaining };
  };

  const handleQtyChange = (boxId: string, val: string, maxAvailable: number) => {
    let num = parseInt(val);
    if (isNaN(num) || num < 1) num = 1;
    if (num > maxAvailable) num = maxAvailable;
    if (num > 9999) num = 9999;
    setBuyQuantities(prev => ({ ...prev, [boxId]: num }));
  };

  const adjustQty = (boxId: string, delta: number, maxAvailable: number) => {
    setBuyQuantities(prev => {
      let current = prev[boxId] || 1;
      let next = current + delta;
      if (next < 1) next = 1;
      if (next > maxAvailable) next = maxAvailable;
      if (next > 9999) next = 9999;
      return { ...prev, [boxId]: next };
    });
  };

  const handleBatchMintClick = async (box: any, currentQty: number) => {
    if (!account) return alert(lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first.');
    setIsBatchMinting(prev => ({ ...prev, [box.id]: true }));

    try {
      const resultsArray = [];
      const idCounts: Record<number, number> = {};
      
      for(let i = 0; i < currentQty; i++) {
         const randomIndex = Math.floor(Math.random() * box.targetIds.length);
         const targetId = box.targetIds[randomIndex];
         idCounts[targetId] = (idCounts[targetId] || 0) + 1;
         
         const nftMeta = hasFetchedNfts ? (allNfts as any[]).find(nft => Number(nft.id) === targetId)?.metadata : null;
         const fallbackItem = NFT_GALLERY_DATA.find(item => item.id === targetId);

         resultsArray.push({ 
            id: targetId, 
            imageUrl: nftMeta?.image || "", 
            name: nftMeta?.name || fallbackItem?.name || `TGY Item #${targetId}` 
         });
      }

      const txKeys = Object.keys(idCounts);
      
      if (txKeys.length > 1) {
          alert(`⚠️ ${lang === 'zh' ? '您本次抽中了多种不同的极品茶饼！系统将分为多笔交易上链，请在弹出的钱包中【连续确认所有签名】，切勿中途关闭！' : 'You drew multiple distinct items! This requires multiple wallet confirmations. Please confirm ALL popups.'}`);
      }

      for (const idStr of txKeys) {
          const qty = idCounts[Number(idStr)];
          const tx = claimTo({
              contract: tgyContract,
              to: account.address,
              tokenId: BigInt(idStr),
              quantity: BigInt(qty)
          });
          await sendTx(tx);
      }

      if (box.id === "tier1" && !unlockedState.tier2) {
        const newState = { ...unlockedState, tier2: true };
        setUnlockedState(newState);
        saveUserUnlock(account.address, newState).catch(()=>{});
      } else if (box.id === "tier2" && !unlockedState.tier3) {
        const newState = { ...unlockedState, tier3: true };
        setUnlockedState(newState);
        saveUserUnlock(account.address, newState).catch(()=>{});
      }

      setMintAnim({ 
        active: true, 
        boxName: box.name, 
        tierClass: box.themeColor,
        colorHex: box.themeHex,
        results: resultsArray
      });
      
      setTimeout(() => {
        setMintAnim(null);
        handleRefresh(); 
      }, 7000); 

      setBuyQuantities(prev => ({ ...prev, [box.id]: 1 }));

    } catch (error: any) {
       console.error("Batch mint failed:", error);
       const errorMsg = error.message || error.toString();
       alert(`❌ ${lang === 'zh' ? '铸造交易失败' : 'Minting Failed'}\n\n原因: ${errorMsg}\n\n💡 检查清单:\n1. 您的钱包是否拥有足够的 USDC 以及支付 Gas 费的 POL (MATIC)？\n2. 您是否在 Thirdweb 后台为抽中的这几个 Token ID 都设置了 Claim Phase (公售阶段)？`);
    }
    
    setIsBatchMinting(prev => ({ ...prev, [box.id]: false }));
  };

  useEffect(() => {
    if (account?.address && isMounted) {
      const savedMessages = localStorage.getItem(`tgy_receipts_${account.address}`);
      if (savedMessages) setInboxMessages(JSON.parse(savedMessages));
    }
  }, [account?.address, isMounted]);

  const saveToInbox = (tokenId: bigint, txHash: string, imageUrl: string | undefined) => {
    if (!account?.address) return;
    const uniqueBurnId = `TGY-${Date.now().toString().slice(-6)}`;
    const newMessage = { id: uniqueBurnId, tokenId: tokenId.toString(), txHash, imageUrl: imageUrl || "", date: new Date().toLocaleString(), text: t.essenceText };
    const updatedMessages = [newMessage, ...inboxMessages];
    setInboxMessages(updatedMessages);
    localStorage.setItem(`tgy_receipts_${account.address}`, JSON.stringify(updatedMessages));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchOwned();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#030604] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ perspective: '800px' }}>
        <div className="absolute w-[200vw] h-[65vh] left-[-50vw] top-0"
             style={{
               backgroundImage: 'linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 1px, transparent 1px)',
               backgroundSize: '50px 50px',
               transformOrigin: 'bottom center',
               transform: 'rotateX(-75deg)', 
               WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 80%)',
               maskImage: 'linear-gradient(to top, transparent 0%, black 80%)',
               animation: 'gridMoveTop 2s linear infinite' 
             }}>
        </div>
        <div className="absolute w-[200vw] h-[65vh] left-[-50vw] bottom-0"
             style={{
               backgroundImage: 'linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 1px, transparent 1px)',
               backgroundSize: '50px 50px',
               transformOrigin: 'top center', 
               transform: 'rotateX(75deg)', 
               WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 80%)',
               maskImage: 'linear-gradient(to bottom, transparent 0%, black 80%)',
               animation: 'gridMoveBottom 2s linear infinite' 
             }}>
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-[40vh] bg-[#030604] -translate-y-1/2 pointer-events-none" style={{ filter: 'blur(50px)', zIndex: 1 }}></div>
      </div>
      
      <nav className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-16 relative z-50">
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-wider text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            TGY<span className="text-emerald-500"> PROTOCOL</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-4 relative">
          {account && (
            <button 
              onClick={() => setIsInboxOpen(!isInboxOpen)}
              className="relative bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              {t.inboxBtn}
              {inboxMessages.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow-lg">
                  {inboxMessages.length}
                </span>
              )}
            </button>
          )}

          <div className="glass-connect-wrapper">
            <ConnectButton client={client} />
          </div>

          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-300"
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>

          {isInboxOpen && account && (
            <div className="absolute top-[120%] right-0 w-[90vw] md:w-[420px] bg-[#0a0f0d]/90 backdrop-blur-2xl border border-emerald-500/20 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center bg-white/5 px-5 py-4 border-b border-white/5">
                <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">{t.inboxTitle}</h3>
                <button onClick={() => setIsInboxOpen(false)} className="text-gray-500 hover:text-white transition">✕</button>
              </div>
              <div className="overflow-y-auto p-4 space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] p-3 rounded-xl mb-2 leading-relaxed">
                  {t.inboxNotice}
                </div>

                {inboxMessages.length === 0 ? (
                  <div className="text-center py-10 text-gray-600 text-sm">{t.inboxEmpty}</div>
                ) : (
                  inboxMessages.map((msg) => (
                    <div key={msg.id} className="bg-white/5 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                      <div className="flex gap-4 mb-3 pb-3 border-b border-white/5">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                          {msg.imageUrl ? <MediaRenderer client={client} src={msg.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-700 bg-gray-900">{t.noImage}</div>}
                        </div>
                        <div className="flex-1">
                          <div className="text-emerald-400 font-mono text-xs font-bold">#{msg.tokenId} - {t.voucher}</div>
                          <div className="text-gray-400 text-[11px] mt-1">{t.redemptionCode}: <span className="text-white font-mono">{msg.id}</span></div>
                          <div className="text-gray-500 text-[10px] mt-1">{msg.date}</div>
                        </div>
                      </div>
                      
                      <div className="bg-black/50 p-2.5 rounded-lg border border-emerald-500/30 mb-3 relative overflow-hidden group">
                        <div className="text-[10px] text-emerald-500 mb-1">{t.shippingNotice}</div>
                        <div className="text-[11px] text-gray-300 font-mono break-all select-all selection:bg-emerald-500/30">
                          Tx: <span className="text-white">{msg.txHash}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <a 
                          href="https://forms.gle/vP4G6Xy42z61YQxK8" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#052b1b] text-xs font-bold py-2.5 px-2 rounded-lg text-center transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center"
                        >
                          {t.fillShipping}
                        </a>
                        <a 
                          href="https://x.com/TGYprotocol" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-2.5 px-2 rounded-lg text-center transition-all duration-300 flex items-center justify-center"
                        >
                          {t.twitterClaim}
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto space-y-16 relative z-10">
        {account && (
          <>
            <section className="relative w-full">
              
              <div className="mb-10 text-center md:text-left">
                <p className="text-gray-400 text-lg mb-2">Mystery Boxes</p>
                <h3 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.2)]">
                  {t.storeTitle}
                </h3>
                <p className="text-emerald-500/80 text-sm mt-3">{t.storeDesc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mysteryBoxes.map((box) => {
                  let isLocked = false;
                  let lockMsg = "";
                  
                  if (box.id === "tier2") {
                    isLocked = !unlockedState.tier2;
                    lockMsg = t.lockMsgTier2;
                  } else if (box.id === "tier3") {
                    isLocked = !unlockedState.tier3;
                    lockMsg = t.lockMsgTier3;
                  }

                  const { remaining, max } = getInventory(box.targetIds);
                  const currentQty = buyQuantities[box.id] || 1;
                  const isProcessing = isBatchMinting[box.id] || false;
                  const disableMint = isProcessing || remaining < 1;

                  return (
                    <div 
                      key={box.id} 
                      className={`relative bg-gradient-to-b from-emerald-950/20 to-[#0a0a0a]/80 backdrop-blur-2xl rounded-[2rem] border border-emerald-500/20 overflow-hidden flex flex-col p-6 transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${isLocked ? 'opacity-60 grayscale-[0.5]' : 'hover:border-emerald-500/60 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(16,185,129,0.2)]'}`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                      {isLocked && (
                        <div className="absolute inset-0 z-30 bg-[#050505]/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center rounded-[2rem]">
                          <span className="text-5xl mb-4 drop-shadow-2xl">🔒</span>
                          <span className="text-xs font-bold text-gray-300 max-w-[80%] leading-relaxed bg-black/50 px-4 py-2 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,1)]">
                            {lockMsg}
                          </span>
                        </div>
                      )}

                      <div 
                        onClick={() => !isLocked && setPreviewBoxId(box.id)}
                        className={`w-full aspect-square rounded-2xl bg-black/50 mb-6 overflow-hidden relative z-10 border border-emerald-500/10 flex-shrink-0 flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] group ${isLocked ? '' : 'cursor-pointer'}`}
                      >
                        <div className="text-8xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                          🎁
                        </div>
                        
                        {!isLocked && (
                           <div className="absolute inset-0 bg-[#030604]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                              <span className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-bold px-4 py-2 rounded-full text-sm shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                {t.clickToPreview}
                              </span>
                           </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col px-2 z-10">
                        <h4 className="text-xl font-bold text-white tracking-tight leading-tight mb-2 drop-shadow-md">{box.name}</h4>
                        <p className="text-sm text-gray-400 mb-6 line-clamp-2">{box.desc}</p>

                        <div className="mt-auto flex flex-col">
                          
                          <div className="flex justify-between items-center text-[11px] text-gray-400 mb-3 border-b border-white/10 pb-2">
                             <span>{t.stock}</span>
                             <span className="font-mono text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">{remaining} / {max}</span>
                          </div>

                          {!isLocked && (
                            <div className="flex items-center justify-between bg-black/50 rounded-xl p-1.5 border border-white/10 mb-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                               <button onClick={() => adjustQty(box.id, -1, remaining)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">-</button>
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-gray-500 uppercase">{t.qty}</span>
                                 <input 
                                    type="number" 
                                    value={currentQty} 
                                    onChange={(e) => handleQtyChange(box.id, e.target.value, remaining)} 
                                    className="w-12 text-center bg-transparent text-white font-mono font-bold outline-none no-spinners" 
                                 />
                               </div>
                               <button onClick={() => adjustQty(box.id, 1, remaining)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">+</button>
                               <button onClick={() => setBuyQuantities(prev => ({...prev, [box.id]: remaining > 9999 ? 9999 : remaining}))} className="w-10 h-8 flex items-center justify-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors ml-1">{t.max}</button>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Price</span>
                              <span className="text-lg font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                                {box.price}
                              </span>
                            </div>

                            {!isLocked ? (
                              <button
                                disabled={disableMint}
                                onClick={() => handleBatchMintClick(box, currentQty)}
                                className="!w-auto !min-w-[120px] !bg-[#0ae38d] hover:!bg-[#08c97d] !text-[#052b1b] !text-sm !font-bold !py-3 !px-5 !rounded-xl !border-none transition-all duration-300 shadow-[0_0_20px_rgba(10,227,141,0.3)] hover:shadow-[0_0_30px_rgba(10,227,141,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isProcessing ? t.mintingBtn : t.mintBtn}
                              </button>
                            ) : (
                              <button disabled className="bg-white/5 border border-white/10 text-gray-500 text-sm font-bold py-3 px-6 rounded-xl cursor-not-allowed">
                                {t.lockedBtn}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="relative w-full">
              
              <div className="redeem-glass-box rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden">
                
                <div className="relative z-20">
                  <h3 className="text-3xl font-bold mb-3 text-white flex items-center gap-3 drop-shadow-md">
                    {t.redeemTitle}
                  </h3> 
                  <p className="text-gray-400 text-base mb-10 max-w-2xl">{t.redeemDesc}</p>

                  <div className="bg-[#0b100e]/80 border border-white/5 p-6 md:p-8 rounded-[2rem] space-y-6 flex-1 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] relative z-10 backdrop-blur-md">
                    
                    <div className="flex justify-between items-center border-b border-white/10 pb-5 mb-6">
                      <div className="text-lg text-emerald-400 font-bold flex items-center gap-2">
                        <span>✨</span> {t.holdingTitle}
                      </div>
                      <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`flex items-center gap-2 text-xs px-4 py-2 rounded-xl border transition-all duration-300 ${isRefreshing ? 'bg-white/5 border-white/10 text-gray-500 cursor-wait' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}
                      >
                        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {isRefreshing ? '正在扫描展厅...' : t.refreshBtn}
                      </button>
                    </div>

                    {isOwnedLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-emerald-500/50">
                        <svg className="animate-spin w-10 h-10 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-sm font-bold tracking-widest">{t.scanning}</p>
                      </div>
                    ) : !ownedNfts || ownedNfts.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-white/[0.02] py-24 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center">
                        <span className="text-4xl mb-4 opacity-40">🏛️</span>
                        {t.noNfts}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar pt-4">
                        {ownedNfts.map((ownedNft) => {
                          const currentQty = ownedNft.quantityOwned || BigInt(0);
                          if (currentQty === BigInt(0)) return null;

                          const idNum = Number(ownedNft.id);
                          
                          let tierLabel = "";
                          let tierBadgeClass = "";
                          let spotlightClass = "";
                          let stageClass = "";
                          let cardGlowClass = "";

                          if (TIER_1_POOLS.includes(idNum)) {
                            tierLabel = lang === "zh" ? "🍵 核心款" : "🍵 Tier 1";
                            tierBadgeClass = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
                            spotlightClass = "bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.25)_0%,transparent_60%)]";
                            stageClass = "border-emerald-500/60 bg-emerald-950/40 shadow-[0_15px_30px_rgba(16,185,129,0.3)]";
                            cardGlowClass = "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]";
                          } else if (TIER_2_POOLS.includes(idNum)) {
                            tierLabel = lang === "zh" ? "🌿 品鉴款" : "🌿 Tier 2";
                            tierBadgeClass = "text-purple-400 border-purple-500/30 bg-purple-500/10";
                            spotlightClass = "bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.25)_0%,transparent_60%)]";
                            stageClass = "border-purple-500/60 bg-purple-950/40 shadow-[0_15px_30px_rgba(168,85,247,0.3)]";
                            cardGlowClass = "border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]";
                          } else if (TIER_3_POOLS.includes(idNum)) {
                            tierLabel = lang === "zh" ? "👑 茶王款" : "👑 Tier 3";
                            tierBadgeClass = "text-amber-400 border-amber-500/30 bg-amber-500/10";
                            spotlightClass = "bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.25)_0%,transparent_60%)]";
                            stageClass = "border-amber-500/60 bg-amber-950/40 shadow-[0_15px_30px_rgba(245,158,11,0.3)]";
                            cardGlowClass = "border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]";
                          }

                          return (
                            <div key={ownedNft.id.toString()} className="flex flex-col items-center bg-[#070b09] hover:bg-[#0a120e] p-6 rounded-[2.5rem] border border-white/5 transition-all duration-500 group relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] mt-6">
                              
                              <div className={`absolute top-0 w-[150%] h-[120%] pointer-events-none ${spotlightClass} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}></div>

                              <div className="relative w-full aspect-[4/3] flex flex-col items-center justify-center mb-10" style={{ perspective: '1000px' }}>
                                
                                <div className="relative w-28 h-28 z-30 animate-spin-slow group-hover:[animation-play-state:paused] hover:scale-125 transition-transform duration-500 cursor-zoom-in" style={{ transformStyle: 'preserve-3d' }}>
                                  <MediaRenderer 
                                    client={client} 
                                    src={ownedNft.metadata.image} 
                                    className={`w-full h-full object-cover rounded-2xl border-2 ${cardGlowClass} bg-black`} 
                                  />
                                </div>

                                <div className="absolute bottom-[-15%] flex flex-col items-center justify-center w-full group-hover:translate-y-2 transition-transform duration-500">
                                  <div className={`w-44 h-16 rounded-[50%] border-b-[4px] border-r-[2px] ${stageClass} absolute bottom-0`}></div>
                                  <div className={`w-32 h-12 rounded-[50%] border-b-[2px] border-r-[1px] border-white/20 bg-[#040605] absolute bottom-3 z-10 shadow-[0_10px_20px_rgba(0,0,0,0.9)]`}></div>
                                  <div className={`w-24 h-8 rounded-[50%] border-[2px] ${cardGlowClass} bg-black/90 absolute bottom-7 z-20 shadow-[inset_0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center`}>
                                     <div className="w-10 h-4 rounded-[50%] bg-white/10 blur-sm"></div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-center w-full z-40 mt-auto bg-black/30 w-[110%] -mb-6 -mx-6 p-6 backdrop-blur-sm border-t border-white/5">
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border mb-3 ${tierBadgeClass}`}>
                                  {tierLabel}
                                </span>
                                
                                <div className="text-white font-mono text-xl font-bold mb-1 drop-shadow-md tracking-wider">
                                  {t.idLabel} #{ownedNft.id.toString()}
                                </div>
                                
                                <div className="text-gray-500 text-xs font-mono mb-5 bg-black/50 border border-white/5 px-4 py-1.5 rounded-xl">
                                  {t.qtyLabel}: <span className="text-white font-bold text-sm ml-1">{currentQty.toString()}</span>
                                </div>

                                <TransactionButton
                                  transaction={() => prepareContractCall({
                                    contract: tgyContract,
                                    method: {
                                      name: "safeTransferFrom",
                                      type: "function",
                                      inputs: [
                                        { type: "address", name: "from" },
                                        { type: "address", name: "to" },
                                        { type: "uint256", name: "id" },
                                        { type: "uint256", name: "value" },
                                        { type: "bytes", name: "data" }
                                      ],
                                      outputs: [],
                                      stateMutability: "nonpayable"
                                    },
                                    params: [account?.address || "", "0x0000000000000000000000000000000000000000", ownedNft.id, BigInt(1), "0x"]
                                  })}
                                  onTransactionConfirmed={(receipt: any) => {
                                    const randomQuote = t.burnQuotes[Math.floor(Math.random() * t.burnQuotes.length)];

                                    if (TIER_1_POOLS.includes(idNum) && !unlockedState.tier2) {
                                      const newState = { ...unlockedState, tier2: true };
                                      setUnlockedState(newState);
                                      saveUserUnlock(account.address, newState).catch(()=>{});
                                    } else if (TIER_2_POOLS.includes(idNum) && !unlockedState.tier3) {
                                      const newState = { ...unlockedState, tier3: true };
                                      setUnlockedState(newState);
                                      saveUserUnlock(account.address, newState).catch(()=>{});
                                    }

                                    setBurnAnim({ 
                                      active: true, 
                                      imageUrl: ownedNft.metadata.image || "",
                                      quote: randomQuote
                                    });
                                    
                                    setTimeout(() => {
                                      saveToInbox(ownedNft.id, receipt.transactionHash, ownedNft.metadata.image);
                                      setBurnAnim(null);
                                      setIsInboxOpen(true);
                                      handleRefresh();
                                    }, 10000); 
                                  }}
                                  onError={(error: any) => { alert("销毁发生异常，请确保网络通畅。错误信息: " + error.message); }}
                                  className="!w-full !bg-[#311116] hover:!bg-[#e11d48] !text-[#f43f5e] hover:!text-white !text-sm !font-bold !py-3.5 !rounded-2xl !border-none transition-all duration-300 shadow-[0_0_15px_rgba(225,29,72,0.2)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] uppercase tracking-widest"
                                >
                                  {t.burnBtn}
                                </TransactionButton>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* 🌟 核心修复 3：无敌兜底的奖池全息预览弹窗 */}
      {activePreviewBox && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" 
          onClick={() => setPreviewBoxId(null)}
        >
          <div 
            className="bg-[#0b100e] border border-emerald-500/30 rounded-[2rem] p-6 md:p-10 w-full max-w-3xl relative shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <button onClick={() => setPreviewBoxId(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center z-20">✕</button>
            
            <div className="mb-8 text-center relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2 tracking-wide flex items-center justify-center gap-2">
                {activePreviewBox.name} <span className="text-emerald-500">- {t.previewTitle}</span>
              </h3>
              <p className="text-gray-400 text-sm">{t.previewDesc}</p>
            </div>

            {/* 超时兜底逻辑 */}
            {isCurrentlyLoadingNfts ? (
              <div className="flex flex-col justify-center items-center py-16 space-y-4 relative z-10">
                 <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                 <p className="text-emerald-500/50 text-sm font-mono tracking-widest">{t.scanning}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {hasFetchedNfts ? (
                  (allNfts as any[]).filter(nft => activePreviewBox.targetIds.includes(Number(nft.id))).map(nft => (
                    <div key={nft.id.toString()} className="bg-[#030604]/50 rounded-2xl p-4 border border-white/10 text-center flex flex-col items-center shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                       <div className="w-full aspect-square rounded-xl overflow-hidden bg-black mb-4 border border-white/5">
                         <MediaRenderer client={client} src={nft.metadata.image} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                       </div>
                       <span className="text-emerald-400 font-bold font-mono text-lg drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                         #{nft.id.toString()}
                       </span>
                       <span className="text-gray-400 text-xs mt-1.5 font-bold line-clamp-1 bg-white/5 px-2 py-1 rounded-md">
                         {nft.metadata.name || `TGY Mystery Item`}
                       </span>
                    </div>
                  ))
                ) : (
                  /* 🚀 如果链上数据因为节点问题没抓到，立刻启用本地字典兜底！ */
                  NFT_GALLERY_DATA.filter(item => activePreviewBox.targetIds.includes(item.id)).map(item => (
                    <div key={item.id} className="bg-[#030604]/50 rounded-2xl p-4 border border-emerald-500/20 text-center flex flex-col items-center shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
                       
                       <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-emerald-900/40 to-black mb-4 flex flex-col items-center justify-center border border-white/5 relative group">
                          <div className="text-5xl mb-2 group-hover:scale-125 transition-transform duration-300">
                            {item.tier === 1 ? '🍵' : item.tier === 2 ? '🏛️' : '👑'}
                          </div>
                          <span className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-mono">TGY Asset</span>
                       </div>
                       
                       <span className="text-emerald-400 font-bold font-mono text-lg drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                         #{item.id}
                       </span>
                       <span className="text-white text-sm mt-1.5 font-bold line-clamp-1">
                         {item.name}
                       </span>
                       <span className="text-gray-500 text-[10px] mt-1 bg-white/5 px-2 py-0.5 rounded">
                         RWA: {item.rwaReward}
                       </span>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-8 text-center relative z-10">
               <p className="text-gray-500 text-xs italic bg-black/30 py-2 rounded-xl border border-white/5 inline-block px-6">
                 {t.probabilityNote}
               </p>
            </div>
          </div>
        </div>
      )}

      {/* 🌌 卡冈图雅黑洞全屏特效层 */}
      {burnAnim?.active && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020005] overflow-hidden select-none" style={{ perspective: '1200px' }}>
           
           <div className="absolute inset-0 z-0 opacity-40 animate-[slowSkyPan_60s_linear_infinite]"
                style={{
                  backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #ffffff, transparent), radial-gradient(1.5px 1.5px at 50px 70px, rgba(255,255,255,0.8), transparent), radial-gradient(2px 2px at 90px 160px, #ffccaa, transparent)',
                  backgroundSize: '200px 200px',
                }}>
           </div>
           
           <div className="absolute w-[150vw] h-[150vw] bg-[radial-gradient(circle_at_center,rgba(50,20,100,0.4)_0%,transparent_60%)] z-0 blur-[50px] animate-pulse"></div>

           <div className="absolute flex items-center justify-center z-10 pointer-events-none w-full h-full" style={{ transform: 'rotateZ(-15deg)' }}>
              
              <div className="absolute w-[280px] h-[400px] md:w-[420px] md:h-[600px] rounded-[50%] border-[20px] border-t-white border-b-orange-400 border-l-transparent border-r-transparent animate-[pulse_3s_ease-in-out_infinite]"
                   style={{
                     boxShadow: '0 0 80px 30px #ff5a00, inset 0 0 60px 20px #ff9800',
                     filter: 'blur(12px)',
                     mixBlendMode: 'screen',
                     transform: 'rotateZ(90deg) scale(1.2)'
                   }}>
              </div>

              <div className="absolute z-20 w-[240px] h-[240px] md:w-[360px] md:h-[360px] bg-black rounded-full flex items-center justify-center"
                   style={{ boxShadow: '0 0 50px 20px rgba(0,0,0,1), 0 0 100px 40px rgba(255,70,0,0.5)' }}>
                 <div className="absolute w-[102%] h-[102%] rounded-full border-[3px] border-white/50 opacity-80 blur-[2px] animate-ping"></div>
              </div>
              
              <div className="absolute z-30 flex items-center justify-center" style={{ transform: 'rotateX(75deg)', transformStyle: 'preserve-3d' }}>
                  <div className="absolute w-[800px] h-[800px] md:w-[1200px] md:h-[1200px] rounded-full animate-[spin_10s_linear_infinite_reverse]"
                       style={{
                         background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,100,0,0.2) 20%, rgba(255,200,100,0.4) 40%, transparent 50%, rgba(255,100,0,0.2) 70%, rgba(255,200,100,0.4) 90%, transparent 100%)',
                         filter: 'blur(20px)',
                         mixBlendMode: 'screen'
                       }}>
                  </div>
                  
                  <div className="absolute w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] rounded-full border-[40px] md:border-[60px] border-transparent animate-[spin_2s_linear_infinite]"
                       style={{
                         background: 'conic-gradient(from 180deg, transparent 0%, #ff4d00 15%, #ffcc00 35%, #ffffff 45%, #ffcc00 60%, #ff4d00 85%, transparent 100%)',
                         WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 50%)',
                         maskImage: 'radial-gradient(circle, transparent 40%, black 50%)',
                         filter: 'blur(5px) brightness(1.5)',
                         mixBlendMode: 'screen',
                         boxShadow: '0 0 150px 50px rgba(255,100,0,0.8), inset 0 0 100px 30px rgba(255,200,0,0.8)'
                       }}>
                  </div>
              </div>
           </div>

           <div className="absolute z-40 pointer-events-none transform-gpu animate-[spaghettification_3.5s_cubic-bezier(0.6,0,0.3,1)_forwards] flex items-center justify-center">
              <div className="relative p-1 rounded-2xl bg-black/40 border border-white/20">
                {burnAnim.imageUrl ? (
                  <MediaRenderer client={client} src={burnAnim.imageUrl} className="w-48 h-48 md:w-56 md:h-56 rounded-xl object-cover shadow-[0_0_80px_rgba(255,255,255,0.6)]" />
                ) : (
                  <div className="w-48 h-48 md:w-56 md:h-56 bg-black rounded-xl border border-white/20"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/70 via-orange-500/40 to-transparent mix-blend-color-dodge rounded-xl opacity-0 animate-[redshift_3.5s_ease-in_forwards]"></div>
              </div>
           </div>

           <div className="absolute z-[60] opacity-0 animate-[cinematicFadeIn_2s_cubic-bezier(0.2,0.8,0.2,1)_3.5s_forwards] flex flex-col items-center w-full max-w-4xl px-6">
              <h2 className="text-white font-extrabold text-3xl md:text-5xl tracking-[0.25em] text-center font-sans uppercase text-shadow-heavy">
                {t.burnSuccessTitle}
              </h2>
              <p className="text-emerald-400 font-bold font-mono text-xs md:text-sm tracking-[0.35em] mt-3 mb-12 text-center uppercase text-shadow-heavy">
                {t.burnSuccessSub}
              </p>
              
              <div className="w-full backdrop-blur-2xl bg-black/50 px-8 py-8 md:px-12 md:py-10 rounded-[2rem] border border-emerald-500/30 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.15)] transform-gpu transition-colors duration-500 hover:border-emerald-500/60">
                <p className="text-white text-lg md:text-2xl font-bold leading-loose tracking-[0.1em] font-sans text-center" style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
                  “ {burnAnim.quote} ”
                </p>
              </div>
           </div>
        </div>
      )}

      {/* 🚀 批量开箱智能引擎 (Batch Mint Reveal) */}
      {mintAnim?.active && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-3xl overflow-hidden" style={{ perspective: '1200px' }}>
           
           <div className="absolute w-[200vw] h-[200vw] animate-[spin_6s_linear_infinite] opacity-30" 
                style={{ background: `conic-gradient(from 0deg at 50% 50%, rgba(0,0,0,0) 0%, ${mintAnim.colorHex}0.6) 25%, rgba(0,0,0,0) 50%, ${mintAnim.colorHex}0.6) 75%, rgba(0,0,0,0) 100%)` }}>
           </div>

           <div className="absolute top-[8%] text-center z-40 opacity-0 animate-[fadeIn_0.5s_ease-in_forwards]">
              <div className={`text-4xl md:text-5xl font-extrabold tracking-[0.2em] uppercase mb-4 ${mintAnim.tierClass} text-shadow-superheavy`}>
                {t.mintTitle}
              </div>
              <div className="text-gray-200 font-mono text-sm md:text-lg bg-black/50 px-6 py-2 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,1)] text-shadow-heavy inline-block">
                {mintAnim.boxName} - {t.mintSub} (x{mintAnim.results.length})
              </div>
           </div>

           <div className="relative flex items-center justify-center w-full h-[60vh] z-30 mt-10">
              <div className="absolute text-[8rem] filter drop-shadow-[0_0_80px_rgba(255,255,255,0.4)] animate-[boxExplode_1s_ease-out_forwards] z-20">🎁</div>

              {mintAnim.results.length <= 5 && (
                 <div className="flex flex-wrap gap-4 md:gap-8 items-center justify-center mt-10 max-w-4xl mx-auto px-4">
                    {mintAnim.results.map((res, i) => (
                        <div key={i} className="opacity-0 animate-[cardFlyUp_1.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards]" style={{ animationDelay: `${0.5 + i * 0.2}s` }}>
                            <div className="w-28 h-28 md:w-44 md:h-44 rounded-[1.5rem] border-[3px] bg-black flex flex-col items-center justify-center overflow-hidden relative transition-transform duration-300 hover:scale-110 hover:z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer" 
                                 style={{ color: mintAnim.colorHex.replace('rgba', 'rgb').replace(',',' '), borderColor: mintAnim.colorHex.replace('rgba', 'rgb').replace(',',' ') }}>
                               {res.imageUrl ? (
                                  <MediaRenderer client={client} src={res.imageUrl} className="w-full h-full object-cover z-0" />
                               ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-black z-0 flex items-center justify-center text-4xl">
                                     {mintAnim.boxName.includes("Tier 1") ? '🍵' : mintAnim.boxName.includes("Tier 2") ? '🏛️' : '👑'}
                                  </div>
                               )}
                               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10"></div>
                               <div className="absolute bottom-3 font-mono text-[10px] md:text-xs font-bold tracking-widest uppercase text-white z-20 drop-shadow-md text-center px-2">{res.name}</div>
                            </div>
                        </div>
                    ))}
                 </div>
              )}

              {mintAnim.results.length > 5 && (
                 <div className="relative flex items-center justify-center mt-32 w-full max-w-3xl">
                    {mintAnim.results.slice(0, 15).map((res, i) => {
                        const totalCards = Math.min(mintAnim.results.length, 15);
                        const angle = -45 + (90 / (totalCards - 1)) * i;
                        const translateY = Math.abs(angle) * 1.2; 

                        return (
                            <div key={i} className="absolute origin-bottom opacity-0 animate-[cardFanOut_1.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
                                 style={{ animationDelay: `${0.5 + i * 0.1}s`, zIndex: i }}>
                               <div style={{ transform: `rotate(${angle}deg) translateY(-${120 - translateY}px)` }} 
                                    className="transition-transform duration-300 hover:-translate-y-32 hover:scale-110 cursor-pointer">
                                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-xl border-[3px] bg-black flex flex-col items-center justify-center overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)]" 
                                       style={{ color: mintAnim.colorHex.replace('rgba', 'rgb').replace(',',' '), borderColor: mintAnim.colorHex.replace('rgba', 'rgb').replace(',',' ') }}>
                                     {res.imageUrl ? (
                                        <MediaRenderer client={client} src={res.imageUrl} className="w-full h-full object-cover z-0" />
                                     ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-black z-0 flex items-center justify-center text-4xl">
                                           {mintAnim.boxName.includes("Tier 1") ? '🍵' : mintAnim.boxName.includes("Tier 2") ? '🏛️' : '👑'}
                                        </div>
                                     )}
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10"></div>
                                  </div>
                               </div>
                            </div>
                        );
                    })}

                    {mintAnim.results.length > 15 && (
                       <div className="absolute z-50 opacity-0 animate-[fadeIn_1s_ease-out_forwards]" style={{ animationDelay: '2.5s' }}>
                          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border-2 border-emerald-500 shadow-[0_0_50px_#10b981] flex flex-col items-center transform hover:scale-110 transition-transform">
                             <span className="text-white text-xs tracking-widest uppercase mb-1">More Items</span>
                             <span className="text-emerald-400 text-3xl font-extrabold font-mono text-shadow-superheavy">
                               +{mintAnim.results.length - 15}
                             </span>
                          </div>
                       </div>
                    )}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* 🌟 动画引擎驱动 */}
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none; margin: 0;
        }
        .no-spinners { -moz-appearance: textfield; }

        .text-stroke-heavy {
          color: #ffffff;
          -webkit-text-stroke: 1px rgba(0, 0, 0, 0.8);
          text-shadow: 0 4px 30px rgba(0, 0, 0, 1), 0 2px 10px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 0, 0, 1);
        }

        .text-shadow-heavy { text-shadow: 0 4px 20px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,1), 0 2px 5px rgba(0,0,0,0.8); }
        .text-shadow-superheavy { text-shadow: 0 5px 30px rgba(0, 0, 0, 1), 0 0 60px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.8); }

        @keyframes slowSkyPan { from { background-position: 0px 0px; } to { background-position: 500px 1000px; } }

        @keyframes spaghettification {
          0% { transform: scale(1) translateY(200px) rotate(-10deg) translateZ(100px); filter: brightness(1) blur(0); opacity: 1; }
          30% { transform: scale(0.8) translateY(100px) rotate(45deg) translateZ(50px); filter: brightness(1.5) blur(1px) drop-shadow(0 0 30px #ffb84d); opacity: 1; }
          60% { transform: scaleX(0.2) scaleY(3) translateY(0px) rotate(180deg) translateZ(0px); filter: brightness(4) sepia(1) hue-rotate(-30deg) blur(5px); opacity: 0.9; }
          85% { transform: scaleX(0.02) scaleY(8) translateY(0px) rotate(360deg) translateZ(-50px); filter: brightness(8) sepia(1) hue-rotate(-50deg) blur(12px); opacity: 0.8; }
          100% { transform: scale(0) translateY(0px) rotate(720deg) translateZ(-100px); opacity: 0; filter: brightness(10) blur(20px); }
        }
        
        @keyframes redshift { 0% { opacity: 0; } 50% { opacity: 0.8; } 100% { opacity: 1; } }
        @keyframes cinematicFadeIn { 0% { transform: translateY(30px); opacity: 0; filter: blur(10px); } 100% { transform: translateY(0); opacity: 1; filter: blur(0px); } }
        @keyframes boxExplode { 0%, 100% { transform: scale(1); opacity: 0; } 20% { transform: scale(1.1) rotate(-10deg); opacity: 1; } 40% { transform: scale(1.1) rotate(10deg); opacity: 1; filter: brightness(2); } 60% { transform: scale(1.4); filter: brightness(3); opacity: 1; } 80% { transform: scale(0); opacity: 0; } }

        @keyframes cardFlyUp {
          0% { transform: translateY(150px) scale(0) rotateX(45deg); opacity: 0; }
          100% { transform: translateY(0) scale(1) rotateX(0deg); opacity: 1; }
        }
        @keyframes cardFanOut {
          0% { transform: translateY(200px) scale(0); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @keyframes spinY { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        .animate-spin-slow { animation: spinY 12s linear infinite; }

        .glass-connect-wrapper button { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; backdrop-filter: blur(10px) !important; border-radius: 0.75rem !important; transition: all 0.3s ease !important; }
        .glass-connect-wrapper button:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(16,185,129,0.5) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.5); }
        @keyframes gridMoveTop { 0% { background-position: 0 0; } 100% { background-position: 0 50px; } }
        @keyframes gridMoveBottom { 0% { background-position: 0 0; } 100% { background-position: 0 50px; } }
        .redeem-glass-box { background-color: #0b1411; border: 1px solid rgba(16,185,129,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1); }
        .redeem-glass-box::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 50%; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' opacity='0.6'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2310b981' stop-opacity='0.8' /%3E%3Cstop offset='100%25' stop-color='%23059669' stop-opacity='0.1' /%3E%3C/linearGradient%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur stdDeviation='8' /%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M300 -50 C 150 100, 450 200, 200 400' stroke='url(%23grad)' stroke-width='40' fill='none' filter='url(%23blur)' /%3E%3Cpath d='M400 0 C 200 150, 500 250, 300 450' stroke='url(%23grad)' stroke-width='80' fill='none' filter='url(%23blur)' /%3E%3Cpath d='M350 -100 C 100 50, 400 150, 150 350' stroke='%2334d399' stroke-width='5' fill='none' opacity='0.5' /%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right center; background-size: cover; mask-image: linear-gradient(to right, transparent 0%, black 50%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 50%); pointer-events: none; z-index: 5; }
      `}</style>
    </main>
  );
}