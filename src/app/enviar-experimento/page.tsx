"use client";
import React, { ChangeEvent, useCallback, useEffect } from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy } from "react-icons/fa";

import { Octokit } from "@octokit/rest";


//Preciso colocar essa logica no home!

export default function SendExperiment() {  
 
  const [experimentData, setExperimentData] = useState({
    id: '',
    topicGeneral: '',
    topicSpecific: '',
    topicBncc: '',
    profileImage: '',
    profileName: '',
    postDate: '',
    title: '',
    slug: '',
    imagePreview: '',
    description: '',
    literature: '',
    objectives: [],
    materials: [],
    methods: [],
    methodsImages: [],
    results: '',
    scientificExplanation: '',
    references: [],
  });

  
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = event.target;
  
    setExperimentData({
      ...experimentData,
      [name]: value,
    });
  };

  const handleArrayInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
  
    setExperimentData({
      ...experimentData,
      [name]: value.split(',').map((item) => item.trim()),
    });
  };
  

  const generateSlug = useCallback(() => {
    const specialCharsMap: {[key: string]: string} = {
      á: 'a',
      à: 'a',
      ã: 'a',
      â: 'a',
      é: 'e',
      ê: 'e',
      í: 'i',
      ó: 'o',
      õ: 'o',
      ô: 'o',
      ú: 'u',
      ü: 'u',
      ç: 'c',
    };
  
    const titleWithoutSpecialChars = experimentData.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, (match: string) => {
        const replacement = specialCharsMap[match];
        return replacement ? replacement : '';
      });
  
    return titleWithoutSpecialChars
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, [experimentData.title]);
  
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const experimentJson = JSON.stringify({
    ...experimentData,
  });
  console.log(experimentJson);
};


  const handleGenerateId = () => {
    const date = new Date();
    const formattedDate = format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    setExperimentData({
      ...experimentData,
      id: Date.now().toString(),
      postDate: formattedDate,
    });
  };


  useEffect(() => {
    setExperimentData((prevData) => ({
      ...prevData,
      slug: generateSlug(),
    }));
  }, [experimentData.title, generateSlug]);


  const [copied, setCopied] = useState(false);

const handleCopy = () => {
  setCopied(true);
  setTimeout(() => setCopied(false), 2000); // limpa o estado após 2 segundos
};

type FileType = "file" | "dir" | "symlink" | "submodule";

interface FileContent {
  type: FileType;
  size: number;
  name: string;
  path: string;
  content: string | null;
  sha: string;
  url: string;
}


async function handleSend() {
  const octokit = new Octokit({
    auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN
  });

  const branchName = "master";
  const filePath = "src/app/api/data/experimentos.json";
  const fileContent = JSON.stringify(experimentData, null, 2);

  const { data: branch } = await octokit.git.getRef({
    owner: "Fellippemfv",
    repo: "project-science-1",
    ref: `heads/master`,
  });


  const sha = branch.object.sha;

    if (!branch) {
    // a branch não existe, então crie-a
    const { data: newBranch } = await octokit.git.createRef({
      owner: "Fellippemfv",
      repo: "project-science-1",
      ref: `heads/master`,
      sha
    });
  } else {
    // a branch já existe, então use sua referência
    const sha = branch.object.sha;
  }
  

  await octokit.git.updateRef({
    owner: "Fellippemfv",
    repo: "project-science-1",
    ref: `heads/master`,
    sha,
  });

  // busca o conteúdo atual do arquivo
  const { data: fileInfo } = await octokit.repos.getContent({
    owner: "Fellippemfv",
    repo: "project-science-1",
    path: filePath,
    ref: branchName,
  });

  // decodifica o conteúdo atual para uma string
  const currentContent = Buffer.from(fileInfo.content || '', 'base64').toString();

  // converte o conteúdo atual em um array de objetos JSON
  const currentArray = JSON.parse(currentContent);

  // converte o novo conteúdo em um objeto JSON
  const newObject = JSON.parse(fileContent);

  // adiciona o novo objeto ao array existente
  currentArray.push(newObject);

  // converte o array atualizado de volta em uma string JSON
  const updatedContent = JSON.stringify(currentArray, null, 2);  

  // atualiza o conteúdo do arquivo
  const data = await octokit.repos.createOrUpdateFileContents({
    owner: "Fellippemfv",
    repo: "project-science-1",
    path: filePath,
    message: "Update my-file.json",
    content: Buffer.from(updatedContent).toString("base64"),
    branch: branchName,
    sha: fileInfo.sha,
  });

}

  return (
    <>
    <form onSubmit={handleSubmit}>
      <label>
        ID:
        <button onClick={handleGenerateId}>Generate ID</button>
      </label>
      <label>
        General Topic:
        <input type="text" name="topicGeneral" onChange={handleInputChange} />
      </label>
      <label>
        Specific Topic:
        <input type="text" name="topicSpecific" onChange={handleInputChange} />
      </label>
      <label>
        BNCC Topic:
        <input type="text" name="topicBncc" onChange={handleInputChange} />
      </label>
      <label>
        Profile Image:
        <input type="text" name="profileImage" onChange={handleInputChange} />
      </label>
      <label>
        Profile Name:
        <input type="text" name="profileName" onChange={handleInputChange} />
      </label>
      <label>
        Post Date:
        <input type="text" name="postDate" value={experimentData.postDate} onChange={handleInputChange} disabled />
      </label>
      <label>
        Title:
        <input type="text" name="title" onChange={handleInputChange} />
      </label>
      <label>
        Slug:
        <input type="text" name="slug" value={generateSlug()} onChange={handleInputChange} disabled />
      </label>
      <label>
        Image Preview:
        <input type="text" name="imagePreview" onChange={handleInputChange} />
      </label>
      <label>
        Description:
        <textarea name="description" onChange={handleInputChange} />
      </label>
      <label>
        Literature:
        <textarea name="literature" onChange={handleInputChange} />
      </label>
      <label>
        Objectives:
        <input type="text" name="objectives" onChange={handleArrayInputChange} />
      </label>
      <label>
        Materials:
        <input type="text" name="materials" onChange={handleArrayInputChange} />
      </label>
      <label>
        Methods:
        <input type="text" name="methods" onChange={handleArrayInputChange} />
      </label>
      <label>
      MethodsImages:
        <input type="text" name="methodsImages" onChange={handleArrayInputChange} />
      </label>
      <label>
      Results:
        <textarea name="results" onChange={handleInputChange} />
      </label>
      <label>
      ScientificExplanation:
        <textarea name="scientificExplanation" onChange={handleInputChange} />
      </label>
      <label>
      References:
        <input type="text" name="references" onChange={handleArrayInputChange} />
      </label>
    </form>


    {Object.keys(experimentData).length > 0 && (
      <>
        <div className="d-flex justify-content-end">
          <CopyToClipboard text={JSON.stringify(experimentData, null, 2)}>
            <button className="btn btn-outline-primary me-2" onClick={handleCopy}>
              {copied ? "Copiado!" : "Copiar"}
              <FaCopy className="ms-2" />
            </button>
          </CopyToClipboard>
        </div>
        <SyntaxHighlighter language="json" style={dracula}>
          {JSON.stringify(experimentData, null, 2)}
        </SyntaxHighlighter>
      </>
    )}

<button className="btn btn-primary" onClick={handleSend}>
              Enviar
            </button>
    </>
  
  )
}
