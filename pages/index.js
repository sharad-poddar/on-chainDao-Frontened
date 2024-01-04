import styles from '@/styles/Home.module.css';
import {NFTaddress, 
  marketPlaceAddress, 
  DAOaddress, 
  DAOabi, 
  marketPlaceabi, 
  NFTabi} from '@/constant.js';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {useState, useEffect} from 'react';
import { formatEther } from "viem/utils";
import { useAccount, useBalance, useContractRead } from "wagmi";
import { readContract, waitForTransaction, writeContract } from "wagmi/actions";
import { Inter } from "next/font/google";


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});


export default function Home() {

  // using wagmi hook to get the connected account, also used for check of user connect
  const { address, isConnected } = useAccount();
  
  // state variable to check if the component is mounted or not
  const [isMounted, setMounted] = useState(false);
  
  // State variable to show loading state when waiting for a transaction to go through
  const [loading, setLoading] = useState(false);

  // nftTokenId to be purchased after proposal
  const [fakeNftTokenId, setFakeNftTokenId] = useState('');

  // State variable to store all proposals in the DAO
  const [proposals, setProposals] = useState([]);

  // State variable to switch between the 'Create Proposal' and 'View Proposals' tabs
  const [selectedTab, setSelectedTab] = useState("");

  // Fetch the owner of the DAO
  const daoOwner = useContractRead({
    abi: DAOabi.abi,
    address: DAOaddress,
    functionName: "owner",
  }); 

  // fetch the balance of DAO
  const balanceDAO = useBalance({
    address: DAOaddress
  });

  // fetch the number of proposal in DAO
  const numberOfProposals = useContractRead({
    abi: DAOabi,
    address: DAOaddress,
    functionName: "numProposals",
  })

  // fetching the NFT balance of user
  const nftBalanceOfUser = useContractRead({
    abi: NFTabi,
    address: NFTaddress,
    functionName: "balanceOf",
    args: [address]
  })

  // Function to make a createProposal transaction in the DAO 
  async function createProposal(){
    setLoading(true);
    
    // making an transaction
    try{
      const tx = await writeContract({
        address: DAOaddress,
        abi: DAOabi,
        functionName: "createProposal",
        args: [fakeNftTokenId],
      })
      await waitForTransaction(tx);
    }catch(error){
      console.log(error);
      window.alert(error);
    }
    
    setLoading(false);
  }

  // Function to fetch a proposal by it's ID
  async function fetchProposalById(id){
    
    try{
      const proposal = await readContract({
        abi: DAOabi,
        address: DAOaddress,
        functionName: "proposals",
        args: [id],
      })

      const [nftTokenId, deadline, yseVotes, noVotes, executed] = proposal;
      const parsedProposal = {
        proposalId: id,
        nftTokenId: nftTokenId.toString(),
        deadline: new Date(parseInt(deadline.toString()) * 1000),
        yesVotes: yseVotes.toString(),
        noVotes: noVotes.toString(),
        executed: Boolean(executed),
      }

      return parsedProposal;
    
      }catch(error){
      console.log(error);
      window.alert(error);
    }

  }

  // Function to fetch all proposals in the DAO
  async function fetchAllProposal(){
    
    try{
      const proposals = [];
      for(let i=0;i<numberOfProposals;i++){
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    }catch(error){
      console.log(error);
      window.alert(error);
    }

  }

  // Function to vote YAY or NAY on a proposal
  async function voteForProposal(proposalId, vote){
    setLoading(true);
    
    try{
      const tx = writeContract({
        abi: DAOabi,
        address: DAOaddress,
        functionName: "voteOnProposal",
        args: [proposalId, vote],
      })
      await waitForTransaction(tx);
    }catch(error){
      console.log(error);
      window.alert(error);
    }

    setLoading(false);
  }

  // Function to execute a proposal after deadline has been exceeded
  async function executeProposal(proposalId){
    setLoading(true);

    try{
      const tx = await writeContract({
        abi: DAOabi,
        address: DAOaddress,
        functionName: "executeProposal",
        args: [proposalId]
      })
      await waitForTransaction(tx);
    }catch(error){
      console.log(error);
      window.alert(error);
    }

    setLoading(false);
  }

  // function to withdraw ethers from DAO community
  async function withdrawEthers(){
    setLoading(true);

    try{
      const tx = writeContract({
        abi: DAOabi,
        address: DAOaddress,
        functionName: "withdrawEther",
        args: []
      })
      await waitForTransaction(tx);
    }catch(error){
      console.log(error);
      window.alert(error);
    }

    setLoading(false);
  }

  function renderTab(){
    if(selectedTab == "create proposal"){
      return renderCreateProposal();
    }else if(selectedTab == "view proposals"){ 
      return renderViewProposalsTab();
    }else{
      return null;
    }
  }

  // this is tab which will render
  function renderCreateProposal(){
    if(loading){
      return(
        <div>
          loading.... wait for transaction..
        </div>
      )
    }else if(nftBalanceOfUser.data === 0){
      return(
        <div>
          you don't have any nft in your connected address..<br/>
          <b>You cannot create or vote on proposals</b>
        </div>
      )
    }else{
      return(
        <div>
          <label htmlFor='nftId'>Enter the subjected NFT ID: </label>
          <input id='nftId' type='number' placeholder='0' onChange={e=>setFakeNftTokenId(e.target.value)}/>
          <button onClick={createProposal}>create proposal</button>
        </div>
      )
    }
  }


  // view proposal tab
  function renderViewProposalsTab(){
    if(loading){
      return(
        <div>
          loading... waiting for transaction...
        </div>
      )
    }else if(proposals.length == 0){
        <div>
          currently there are no proposals...
        </div>
    }else{
      return(
        <div>
          {proposals.map((proposal, index)=>{
            return(
              <div key={index}>
                <h1>proposal</h1>
                <h2>proposalId - {proposal.proposalId}</h2>
                <p>sunjected NFT to be purchased or not- {proposal.nftTokenId}</p>
                <p>deadline - {proposal.deadline}</p>
                <p>FavourVotes - {proposal.yesVotes}</p>
                <p>AgainstVotes - {proposal.noVotes}</p>
                {proposal.deadline.getTime() > Date.now() && !proposal.executed ? (
                  <div>
                    <button onClick={e => voteForProposal(proposal.id, "YAY")}>count me in</button>
                    <button onClick={e => voteForProposal(proposal.id, "NAY")}>count me out</button>
                  </div>
                    ) : proposal.deadline.getTime() < Date.now() && !proposal.executed ? (
                      <button onClick={e => executeProposal(proposal.id)}>
                        execute proposal
                      </button>
                    ) : (
                      <div>
                        {proposal.yesVotes > proposal.noVotes ? <p>EXECUTED: propsal was in favoured of commnity</p>: <p>EXECUTED: proposal was against community</p>}
                      </div> 
                    )
                }
              </div>
            )
          })}
        </div>
      )
    }
  }

 useEffect(()=>{
  if(selectedTab == 'view proposals')
    fetchAllProposal();
 },[selectedTab])

 useEffect(()=>{
  setMounted(true)
 },[])

 if(!isMounted){
  return null;
 }

 if(!isConnected){
  return (<div>
    <ConnectButton/>
  </div>)
 }

  return (
    <div>
      <title>NFT buyers community: NFTsinners</title>
      <p>description: community to passes the proposal on wheather buying or non buying an NFT is profitable for
        club or not!!
      </p>
      <b>your NFT balance: {nftBalanceOfUser.data}</b>
      {balanceDAO.data && <p>Community Treaser: {balanceDAO.data}</p>}
      <div>
        <button onClick={e=>setSelectedTab('create proposal')}>
          create proposal
        </button>
        <button onClick={e=>setSelectedTab('view proposals')}>
          view proposals
        </button>
      </div>
      {renderTab()}
    </div>
  )
}
