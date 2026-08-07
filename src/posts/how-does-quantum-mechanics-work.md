---
title: How does Quantum Mechanics work?
subtitle: The most complete non-mathematical explanation on the web
nutshell: "This article is a tangible, intuitive intro to quantum mechanics – the way I wish it had been explained to me. It avoids equations & jargon in favor of visual explanations & analogies, yet it is 100% scientifically accurate, to the best of my ability. It starts with two unintuitive (yet foundational) facts about the quantum realm, then applies them in the context of 3 famous quantum mechanical experiments, each revealing more of the profound weirdness of the universe as we know it."
toc: qm-toc.html
img_subdir: qm
img_on_homepage: quantum-background-sm.html
published_on: 2025-11-01
layout: post
css: quantum
js: [post, quantum]
tags: [posts]
published: false
---



{ #introduction }

I’ve spent a few years trying to piece together quantum mechanics, and this article is the result of my work. More than anything, I’ve desired to understand and convey the *ideas* of quantum mechanics. The equations, the terminology – those are only interesting to me so far as they tell about the *inner lives* of atoms and electrons and photons. Basically, I want to be able to explain this stuff with my hands.

{% include img.md, src: "feynman.mp4", alt: "Richard Feynman explaining physics with his hands", caption: "This is what your hands should do when you explain physics. Richard Feynman, our patron saint 🫶", width: "600px" %}

Unfortunately, this is a taller order for quantum mechanics than any other area of science. In quantum mechanics, we have equations that work *extremely well*. But we aren’t sure what they *mean*. We aren’t sure, for instance, if what we do *mathematically* corresponds directly to what happens in reality – or if the math simply arrives at the same result, even though reality is doing something very different under the hood.

In any other area of science, you could just look a little closer and determine what’s really going on. But quantum mechanics *is* the description of what happens when you try to “look a little closer” at photons and atoms and such. The results are so wild that they’d make for bad fiction.

So if we want to explain quantum mechanics with our hands, we have to make an allowance here – nature may not look exactly like what I’m about to describe! But it certainly arrives at the same results. You can ponder the implications shortly. Physicists have; no consensus has emerged.

One other side-note before we begin: I’m avoiding the standard terminology of quantum mechanics until the final section. I feel that using someone else’s jargon is a way to import someone else’s thinking – which has its uses, but quantum mechanical jargon is so laden with odd connotations and historical baggage that, in my opinion, it’s a hindrance to the beginner. So, to get you up-to-speed with the rest of the world, this piece ends with a hefty glossary tying everything you’ll learn to the “official” terminology. But before that, look out for metaphors and visual explanations that favor clarity over precision.

(Physicists, you’ve been warned 😉)

OK, enough pre-amble. Let’s dive right in.

As far as I can tell, basically *all* of the weirdness of QM is due to *two simple facts*. Neither is intuitive in everyday life, but they’re the foundation of the quantum:

1. Probabilities can cancel
2. Particles can split into many “phantom copies” of themselves[^1]

[^1]: I’ll use footnotes for more in-depth comments or technical clarifications. They’re entirely optional to read.

Let’s talk about each of those.



## Probabilities can cancel {data-ordinal="I." #probabilities-can-cancel}

This probably sounds like an arcane mathematical fact, but the implications are wild. Bear with me.

In quantum mechanics (QM), we *do* use normal (or “classical”) probability sometimes – but the majority of the time, we’re thinking in a sort of special quantum probability, which has a unique property: *probabilities can cancel*.

“So you’re saying something can have a -12% chance of happening?”

Kind of! That’s a very useful first approximation.

“OK. But what does it *mean* for something to have a -12% chance of happening?”

For one, it means it cancels out something that has a (positive) 12% chance of happening.

“That’s ridiculous. A 25% chance of drawing a spade cancels a -25% chance of drawing a club!?”

Your intuition is correct – that’s not quite how it works. For these special quantum probabilities to cancel, they have to be probabilities of *the same event happening*. Because when we have two ways for the same event to happen, we *add* the probabilities of the ways.

Take, for example, dice. Say you roll two dice and count the total dots. How many ways are there to roll a 3? There are two ways:

1. The first die is 1 and the second die is 2
2. The first die is 2 and the second die is 1

So the probability of rolling a 3 is the probability of (A) plus the probability of (B).

But now imagine probability (A) is the *negative* of probability (B). That means the two probabilities will add to zero. And *that* would mean… *you would never roll a 3*!

“That’s weird.”

Yes.

Also, if you roll each die individually, they’ll both come up with 1’s and 2’s normally. 12% and -12% look the same when you’re not required to add them together. But if you need to add the probabilities together – as you do when *one event can happen in multiple ways* – then some strange stuff happens.

“Like rolling a pair of dice all day long and never rolling a 3?”

Exactly! And, good news: that’s like half of the weirdness of quantum mechanics right there. It’s about what *doesn’t* happen.

In fact, here’s a hack for understanding QM: if you ever hear about a weird quantum result, simply rephrase it in terms of what *doesn’t* happen, and then rephrase what doesn’t happen in terms of the multiple ways that it *could* happen adding to 0.

The double-slit experiment – which is perhaps the most famous quantum experiment of all time (and we’ll talk about it in-depth shortly) – fits this mold perfectly. You may’ve seen it before, but in case you haven’t, it’s where you shoot particles (e.g. photons, electrons, etc) one at a time through 1 or 2 very small, very close together slits. The particles that make it through the slit(s) are recorded on a screen on the far side. When you add a second slit, the pattern they make becomes unexpectedly complicated.

<div class="double-wide">
    <div class="double-wide__item">
        {% include img.md, src: "single-slit-results.png", width: "350px", caption: "<p>This is expected[^2].</p><p>When you shoot the photons through a slit, they mostly go straight through, with some bending left or right a bit.</p>", alt: "" %}
    </div>
    <div class="double-wide__item">
        {% include img.md, src: "double-slit-results.png", width: "350px", caption: "<p>This is NOT expected.</p><p>Upon adding a second slit, the pattern suddenly changes to alternating light/dark areas. Why would the photons NOT hit some areas?</p>", alt: "" %}
    </div>
</div>

[^2]: Technically, you need QM to explain why the path bends at all! If photons were tiny balls, why wouldn’t they all go straight through? It’s also worth noting that the pattern gets more complex for a larger slit. The clear fall-off is for arbitrarily narrow slits (and yes, that’s for QM reasons too).

This unexpectedly complicated pattern is usually phrased in terms of what *happens*: “a crazy pattern!”

But let’s rephrase this in terms of what *doesn’t* happen.

“Photons don’t land in certain areas?”

Yes. And now let’s rephrase that in terms of the multiple ways it *could* happen. What are the multiple ways that a photon *would* reach one of those dark bands?

“Uh, either going through the left slit or going through the right slit?”

Yes. Which means the probability of it going through the left slit vs. going through the right cancel out.

“Uhh… Didn’t you say the photons are shot one at a time though?”

Yes.

“How could a *single* photon travel both paths and cancel itself out!?”

That’s a great lead-in.



## Multiple phantom copies {data-ordinal="II." #phantom-copies}

The second weird yet generative insight about QM is that things (photons, atoms, etc) seem to have the ability to split into many “phantom copies” of themselves.

I say “phantom copies” because they’re never observed directly.

“So why talk about them at all?”

Because they do leave a mysterious – and important – trace of their existence. I’ll explain in a minute. But first, I want to state, as succinctly as possible, how these phantom copies work:

*Whenever particles lose contact with the outside world, they split into phantom copies that trace out every possible thing the particles could do. However, upon looking, you find each particle in only one state.*

Weird, huh?

Let’s look at a simple example: *an atom emitting a photon*.

It’s possible to put an atom in a state where it’s all but certain to emit a photon within the next fraction of a second. But if the atom and photon are isolated enough from the outside world – say, in the center of a very large vacuum chamber – then there’s some amount of time during which we could not, even in principle, say where the photon is. During that time – even if it’s only a millionth of a second – the photon splits into phantom copies that trace out every possible path the photon *could* take. Specifically:

1. We don’t know the *direction* the photon leaves the atom, so we need phantom copies going *all possible directions*
2. We don’t know *when* the photon leaves, so we need phantom copies leaving at *every possible time*

And, while this will complicate things, and we will return to it later, it’s worth mentioning now:

1. We also need phantom copies of the *atom*, one for each possibility of *when* it jumps down an energy level (which it does when the photon is emitted)

{% include qm/emission.html %}

<p class="caption">Note: I’m only displaying SOME of the photon phantom copies. In reality, they’d cover the surface of the illustration!</p>

You’ll notice the bulk of these phantom photons leave *early* (rather than later) and *horizontally* (rather than vertically). Exactly *why* is specific to the type of atom and the exact configuration of its electrons – but for now, just understand this: ***some outcomes are more likely than others***.

For now, let’s clarify these rules of how phantom copies work.

### “Lose contact with the outside world”

Quantum mechanics says that if we aren’t *currently* detecting the state of some particle – and couldn’t, even in theory, determine its state – then, however brief that duration of isolation is, we need to think of phantom copies doing *every possible thing* the particle could do.

This is a bit of a mindset shift.

First, it forces you to admit you don’t, in a general sense, *know the state of a particle*. Maybe you know…

1. A photon was emitted from an atom *around* time x
2. The photon later hit a sensor *at* location y

But between those two data points, there’s no way to “just keep your eye on the photon”.

If it were a bird, sure. Enough photons bounce off the bird and hit your eyeballs that you can continuously *see* the bird.

But a *photon*? Other photons just pass right through it![^3] To reliably get a second photon to interact with the first, the second would need so high an energy, the first would veer far off course. The better you know where it *just was*, the worse you know where it’s *going*!

[^3]: Except in certain high-energy situations

So in between these brief, specific moments of knowledge about a particle’s state, quantum mechanics pushes you towards saying the path of the particle is *not even a well-defined concept*. It’s all mysterious phantom copies, doing every possible thing the particle could do!

### “Every possible thing the particle could do”

This framing raises a question. What *are* all the things that these phantom copies do?

For starters, for any result that you might observe, there’s a phantom copy doing that thing.

Perhaps more shockingly, there are phantom copies doing things that are *never physically observed* – e.g. particles hitting the blank spots on the back wall of a double-slit experiment, or photons moving faster or slower than the speed of light. (I will explain why you don’t *see* these things shortly)

But in general, any measurable property of a particle or group of particles is a dimension in which these phantom copies can vary. Here’s a fuller list to give you a better idea:

<div data-render-sidenote-in-place="true">

| Condition | Examples |
|-----------|----------|
| Anytime a particle could take **different paths**[^4] | <ul><li>An electron goes through a slit vs. hits a wall</li><li>An atom hits another atom vs. flies past it</li><li>A photon bounces off glass vs. goes through it</li><li>A photon bounces in one direction vs another[^5]</li></ul> |
| Anytime a particle could be somewhere at **different times** | <ul><li>A radioactive atom could emit various particles at different possible times[^6]</li><li>An atom with excited electrons could emit a photon at different possible times</li><li>A particle could travel to a spot faster or slower[^7]</li></ul> |
| Anytime a particle could have **different properties** | <ul><li>The spin of a particle – e.g. proton, neutron, electron, etc. (changed by certain magnetic fields, particle collisions, etc.)</li><li>The polarization of a photon (changed by light hitting certain types of crystals, etc.)</li><li>The energy levels of an atom’s electrons (changed by bombarding it with other particles)</li><li>The rotational speed of a molecule (changed by collisions)</li><li>The amount of vibration between the nuclei of a molecule</li></ul> |
| Other | <ul><li>Electrons in a tiny superconducting wire could travel clockwise or counterclockwise</li></ul> |

</div>

[^4]: The equations of QM don’t allow us to say the *particle* takes any one path. Instead, between the moments of “losing contact” and “regaining contact”, the particle is *only* phantom copies doing every possible permutation of things. As to the nature of the phantom copies, that’s up for debate, and something we’ll talk about in [Interpretations](#cocktail-party).

[^5]: At the everyday level, photons bounce off at the same angle they hit at (“angle of incidence = angle of reflection”). But in QM, phantom copies shoot off at every possible angle. That being said, the phantom versions bouncing at exotic angles cancel each other out, and we only observe the angle of incidence equaling the angle of reflection. For more, [read this book](https://amzn.to/42Vgm3p){target="_blank"}.

[^6]: For example, a radioactive tritium atom will, at some point, emit an electron and an antineutrino. Even though it has a 50% chance of doing this in any given 12.3-year span, you need to account for the possibility of it happening at *every possible moment*

[^7]: At the everyday level, photons travel at the speed of light, c. But in QM, phantom copies can travel faster or slower. That being said, the phantom versions at different exotic speeds always cancel each other out, and we only observe photons moving at the speed of light. For more, [read this book](https://amzn.to/42Vgm3p){target="_blank"}.

That being said, there still has to be *some* uncertainty that generates these phantom copies. If a rotating molecule has zero probability of anything bumping it, the rotating molecule won’t have phantom copies spinning at different speeds. But as soon as it’s possible that it *might* get jostled, then you’ve got phantom copies to consider.

And what jostles the molecule? Phantom copies of other particles, of course! The whole thing is multiplicative.

A single particle – e.g. an electron – traveling through space is *easy* to visualize.

{% include qm/traveling-electron.html %}

You’re *most* likely to see it at a certain point, with the probability decreasing as you spread out.

But as soon as you add a second particle, it’s *far* tougher to visualize.

You need to consider not just every phantom copy from two particles, but every *combination* of phantom copies. This becomes too much to visualize cleanly.

So, I’ll just note this for now, and we’ll return to it in the third experiment: when multiple particles are involved, it’s easier to visualize entire phantom *timelines* rather than simply phantom *copies*.

{% include img.md, src:"possible-branches-of-quantum-particle-collision.png", caption: "", alt:"" %}

As a minor spoiler alert, this is why it’s so hard to simulate quantum systems on computers. For every new particle you *add*, the possibilities you need to keep track of *multiply*. Today’s supercomputers can only handle a small molecule on a good day.

Fortunately, there’s a saving grace. Despite the ungodly multiplication of possible scenarios, as soon as the system makes contact with the outside world – that is, *you* – you find that only *one* scenario actually happened.

Let’s talk about that.

### “You find each particle in only one state”

Whenever you look at a particle (and by “look”, I mean “interact with in some way in order to determine its state”), *you only ever see it in one state*. All those other phantom copies are gone forever. Which state will you see? As best we know, it’s totally random. From all the phantom copies, it’s as if God just picks one out of a hat. But even if we don’t know *which* state we’ll see, we can figure out the *probability* of seeing a particular state.[^8]

[^8]: In theory, anyhow. In practice, this is wildly complicated without simplifying assumptions.

This, by the way, is how *cancellable probabilities* and *phantom copies* come together.

Each phantom copy has a probability of being the one that we see. But it’s not a *normal* probability, with a value between 0 and 1. It’s a *special quantum probability*, which can sometimes cancel.

And when does it cancel? When two phantom copies end up in the *exact same state*, but with *equal and opposite* probabilities.

Here is the analog with classical probability. Read down each column.

| Classical probability | Quantum mechanics |
|-----------------------|-------------------|
| When there are multiple ways… | When there are multiple phantom copies… |
| For an event to happen… | That end up in the same state…[^9]{data-render-sidenote-in-place="true"} |
| Each way has a probability of happening… | Each phantom copy has a special quantum probability of being found in that state… |
| And if you add them together… | And if you add up the special quantum probabilities for each of the indistinguishable phantom copies… |
| You get the total probability of the event. | You get the total quantum probability of the event – which can be 0 – and is directly related to the classical probability of the event |

[^9]: The same position at the same time with the same properties

Before we go on, I want to take a moment and say: this is kind of *it*. We will dive into how this process looks in a few specific scenarios, but as outlined above, this *is* the underlying strange process of QM. We have only unsatisfactory guesses as to what such an odd process *means* about how the universe works. But the rest of this article is *unpacking* this core idea, rather than introducing new similarly large ideas.

Anyhow, this should be a “scales falling off your eyes” moment with respect to a few things I mentioned earlier:

*I say “phantom copies” because they’re never observed directly.*

*“So why talk about them at all?”*

*Because they do leave a mysterious – and important – trace of their existence.*

The trace of their existence is when they cancel out and certain events do not happen.

Or:

*Perhaps more shockingly, there are phantom copies doing things that are never physically observed – e.g. particles hitting the blank spots on the back wall of a double-slit experiment, or photons moving faster or slower than the speed of light. (I will explain why you don’t see these things shortly)*

The events never observed are times when two or more ways in which those events could occur have special quantum probabilities that add up to zero.

Before we look at specific experiments, I want to hammer home one point that’s perhaps the most common *misunderstanding* of QM when scientists explain it to a lay audience. Don’t worry; it’s half review 😉



## “Multiple phantom copies” and “I don’t know” are different {data-ordinal="III." #phantom-vs-unknown}

So, to review: any time a photon, electron, atom, molecule, set of molecules, etc. could do *any number of possible things*, you can think of multiple “phantom copies” doing *all* of those possible things. However, if you could, *even in theory*, know what actually happened, you’ll only ever find *one* thing happened. The phantom versions disappear with hardly a trace.

You might be thinking this sounds like the world’s fanciest way of saying “You don’t know what happened. Then you found out”.

But it is not! It 100%, absolutely is *not*.

There are 2 reasons why “multiple phantom copies” and “I don’t know” are different:

1. Phantom copies that end up in the same state can **cancel each other out** (If you merely *don’t know* something, there’s no cancelling involved)
2. As long as the phantom copies remain isolated enough so one outcome is not distinguishable, you can (carefully) **modify the probability** of various outcomes (not always, but sometimes)[^10]

[^10]: And technically is true of some classical probability distributions as well. If you blindly throw a paper airplane north, then blow a fan east to west across the direction of throwing, *you’ve modified the probability distribution of where you’ll expect to find the paper airplane*. QED! That being said, the quantum mechanical version is much more shocking than something this mundane.

The first of these is the easiest to understand, and if it’s the only thing you get out of this article, that’s totally fine. The second reason is more subtle, and I’ll introduce it via analogy below.

Now, if you’re still with me, let’s talk about 3 classic QM experiments.

The goal here is to build intuition for what the constituent particles of reality spend all of their time doing. Ideally, you want these results to feel not surprising. Accordingly, you may need to re-read these sections a couple of times. But, once you’re there, congrats – you truly grasp the basics of how the smallest building blocks of the universe work!

Let’s get started 😎



## Experiment 1: the double-slit experiment {data-ordinal="IV." #double-slit}

### How quantum probabilities work

### Quantum probabilities over space

### Quantum probabilities & the double-slit experiment

{% include qm/double-slit-paths.html %}

{% include qm/double-slit-pattern.html %}



## Interlude: the parable of the coin {data-ordinal="V." #parable-of-the-coin}



## Experiment 2: the Ramsey experiment {data-ordinal="VI." #ramsey-experiment}



## Experiment 3: the Hong-Ou-Mandel experiment {data-ordinal="VII." #hong-ou-mandel}

{% include qm/hong-ou-mandel.html %}

{% include qm/amplitude-multiplication.html %}



## How to discuss QM at a cocktail party {data-ordinal="VIII." #cocktail-party}

### Amplitude

### Superposition

### Wavefunction

<!-- TODO: this glossary entry is still unwritten. The video below is the finished asset;
     the prose around it is yours. Re-tune or re-export it with tools/wavefunction-studio
     (see its README) — params.json there reproduces this exact clip. -->

{% include img.md, src: "wavefunction-in-3d.mp4", controls: true, width: "700px", alt: "A three-dimensional landscape of a quantum wavefunction passing through a double slit. A rainbow-striped hill travels toward a barrier, part of it bounces back, and the rest fans out beyond the two slits into an interference pattern of ripples.", caption: "The wavefunction of a particle going through a double-slit. The color represents the ANGLE of the amplitude at that point. The height represents the LENGTH of the amplitude at that point. Cancellations between multiple paths lead to wave-like crests and troughs of probability. Note that most probability “bounces back” rather than passing through the slits." %}

### Measurement/Observation

### The Measurement Problem

### Interpretation

### Copenhagen interpretation

### Many Worlds Interpretation

### Quantum computers

### Schrodinger’s Cat

### And all the rest



## Further reading {data-ordinal="IX." #further-reading}
